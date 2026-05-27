"use server";

import { auth, signIn } from "@/auth";
import { AuthError } from "next-auth";
import z from "zod";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { randomInt } from "crypto";
import { addMinutes } from "date-fns";
import nodemailer from "nodemailer";


import { Prisma, VerificationType } from "@/lib/generated/prisma/client";
import { SignUpData, SignInData, schemaSignUp, schemaSignIn } from "@/lib/zod_schemas/auth";
import { MAX_OTP_ATTEMPTS, MIN_RESEND_OTP_MS, PATHS } from "../constants";
import { redirect } from "next/navigation";


type Response__SignUp = {
  success: false;
  errors: {
    fieldErrors: Partial<Record<keyof SignUpData, string[]>>;
    formErrors: string[];
  };
} | {
  success: true;
  errors: {
    fieldErrors: {};
    formErrors: [];
  };
  data: {
    id: string;
  }
}


export async function signUpUser(userData: SignUpData, isSigningUpForHotelOwner = false): Promise<Response__SignUp> {
  const session = await auth();
  if (session && session.user) {
    return {
      success: false,
      errors: {
        fieldErrors: {},
        formErrors: ["Bạn đã đăng nhập, vui lòng đăng xuất để tạo tài khoản mới."],
      },
    };
  }

  const safeParsedUserData = schemaSignUp.safeParse(userData);

  if (!safeParsedUserData.success) {
    const { fieldErrors, formErrors } = z.flattenError(safeParsedUserData.error);
    return {
      success: false,
      errors: { fieldErrors, formErrors },
    };
  }

  const isDevelopment = process.env.NODE_ENV === "development";
  let hashedPassword = safeParsedUserData.data.password;
  if (isDevelopment) {
    console.warn("Running in development mode, storing password in plaintext. DO NOT USE THIS IN PRODUCTION!");
  } else {
    const saltRounds = 10;
    hashedPassword = await bcrypt.hash(safeParsedUserData.data.password, saltRounds);
  }

  const otpCode = generateOTP();
  const role = isSigningUpForHotelOwner ? "HOTEL_OWNER" : "USER";
  const status = "PENDING";

  try {
    const { verificationId } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...safeParsedUserData.data,
          password: hashedPassword,
          role,
          status,
        },
        select: { id: true },
      });

      const verification = await tx.verificationToken.create({
        data: {
          userId: user.id,
          code: otpCode,
          type: "REGISTRATION",
          expiresAt: addMinutes(new Date(), 5),
        },
        select: { id: true },
      });

      return { verificationId: verification.id };
    });

    await sendOtpToEmail(safeParsedUserData.data.name, safeParsedUserData.data.email, otpCode);

    return {
      success: true,
      errors: { fieldErrors: {}, formErrors: [] },
      data: { id: verificationId },
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        errors: {
          fieldErrors: {
            email: ["Email đã được sử dụng!"],
          },
          formErrors: [],
        }
      };
    }
    return {
      success: false,
      errors: {
        fieldErrors: {},
        formErrors: ["Đã có lỗi xảy ra, vui lòng thử lại."]
      },
    };
  }
}

// NOTE: signing in with google requires google cloud account, which requires credit card.
export async function signInUser(
  formData: SignInData,
  callbackUrl?: string
) {
  const safeParsedSignInData = schemaSignIn.safeParse(formData);
  if (!safeParsedSignInData.success) {
    const { fieldErrors, formErrors } = z.flattenError(safeParsedSignInData.error);
    return {
      success: false,
      errors: { fieldErrors, formErrors },
    };
  }

  const { email, password } = safeParsedSignInData.data;
  const user = await prisma.user.findUnique({
    where: { email, status: "PENDING" },
    select: { name: true, password: true },
  });

  if (user) {
  // FIXME: Remove this on production
  const isDevelopment = process.env.NODE_ENV === "development";

  let passwordMatch = false;
  if (isDevelopment) passwordMatch = (password === user.password);
  else passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) return { error: "Thông tin đăng nhập không chính xác!" };
  const lastToken = await prisma.verificationToken.findFirst({
    where: {
      user: { email },
      type: "REGISTRATION",
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

    if (lastToken) {
      redirect(`${PATHS.otp}/${lastToken.id}`);
    } else {
      const otpCode = generateOTP();
      const newToken = await prisma.verificationToken.create({
        data: {
          user: { connect: { email } },
          code: otpCode,
          type: "REGISTRATION",
          expiresAt: addMinutes(new Date(), 5),
        },
        select: { id: true },
      });

      await sendOtpToEmail(user.name, email, otpCode);
      redirect(`${PATHS.otp}/${newToken.id}`);
    }
  } else try {
    await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirectTo: callbackUrl, // Auth.js sẽ xử lý redirect phía server khi có tham số này
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Thông tin đăng nhập không chính xác!" }
        default:
          return { error: "Đã có lỗi xảy ra, vui lòng thử lại." }
      }
    }
    throw error; // Cần throw error để Next.js thực hiện redirect
  }
}


// TODO: lots of edge cases.
export async function user_verifyOTP(id: string, code: string, verificationType: VerificationType): Promise<{
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
  };
}> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.verificationToken.findUnique({
        where: {
          id,
          used: false,
          type: verificationType,
          expiresAt: { gte: new Date() },
        },
        select: {
          id: true,
          userId: true,
          code: true,
          attempts: true,
          user: { select: { role: true, status: true } },
        },
      });

      if (!tokenRecord) {
        return { success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn." };
      }

      if (tokenRecord.code !== code) {
        const newAttempts = tokenRecord.attempts + 1;
        await tx.verificationToken.update({
          where: { id: tokenRecord.id },
          data: { attempts: newAttempts },
        });

        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          return { success: false, message: "Bạn đã vượt quá số lần thử. Vui lòng yêu cầu mã mới." };
        }

        const remaining = MAX_OTP_ATTEMPTS - newAttempts;
        return { success: false, message: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.` };
      }

      const updatedUserStatus =
        verificationType === "REGISTRATION"
          ? tokenRecord.user.role === "HOTEL_OWNER"
            ? "HOTEL_OWNER_FILLING_INFORMATION"
            : "ACTIVE"
          : tokenRecord.user.status;

      if (verificationType === "REGISTRATION") {
        await tx.user.update({
          where: { id: tokenRecord.userId },
          data: { status: updatedUserStatus },
        });
      }

      await tx.verificationToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      });

      return { success: true };
    });

    return result;
  }
  catch (error) {
    console.error("user_verifyOTP error:", error);
    return { success: false, message: "Đã có lỗi xảy ra khi xác thực OTP. Vui lòng thử lại." };
  }
}


function generateOTP() {
  const otp = randomInt(100000, 999999).toString();
  return otp;
}

async function sendOtpToEmail(name: string, email: string, otpCode: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`Development mode: OTP for ${email} is ${otpCode}`);
    return;
  }
  
  if (!email) {
    throw new Error("Recipient email must be provided to send OTP.");
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error("GMAIL_USER and GMAIL_PASS must be set in environment variables to send OTP emails");
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });

  const htmlContent = `
      <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
          <h2 style="margin:0 0 8px 0; color:#333;">Mã xác thực (OTP)</h2>
          <p style="margin:0 0 16px 0; color:#555;">
            Xin chào ${name || 'khách hàng'},<br />
            Hệ thống đã gửi cho bạn mã OTP gồm 6 chữ số để xác thực.
          </p>

          <div style="display:flex; align-items:center; justify-content:center; margin:18px 0;">
            <span style="font-size:28px; letter-spacing:4px; font-weight:700; background:#f1f5f9; padding:12px 20px; border-radius:6px; color:#111;">
              ${otpCode}
            </span>
          </div>

          <p style="margin:0 0 8px 0; color:#555;">
            Mã có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
          </p>

          <hr style="border:none; border-top:1px solid #eee; margin:18px 0;" />

          <p style="margin:0; font-size:12px; color:#999;">
            Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
          </p>
        </div>
      </div>
    `;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: `Mã OTP của bạn`,
    text: `Mã OTP của bạn là ${otpCode}. Mã có hiệu lực trong 5 phút.`,
    html: htmlContent,
  });
}

export async function resendOtpToEmail(referenceId: string, verificationType: VerificationType) {
  const existingToken = await prisma.verificationToken.findFirst({
    where: {
      id: referenceId,
      type: verificationType,
      expiresAt: { gte: new Date() },
      used: false,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      user: { select: { email: true, name: true } },
      createdAt: true,
    }
  });

  if (!existingToken) {
    throw new Error("Có lỗi xảy ra. Vui lòng thử lại sau.");
  }

  // throttle by creation time to avoid rapid repeated requests
  if (Date.now() - existingToken.createdAt.getTime() < MIN_RESEND_OTP_MS) {
    throw new Error(`Vui lòng đợi ít nhất ${MIN_RESEND_OTP_MS / 1000} giây trước khi gửi lại mã OTP.`);
  }

  const newOtpCode = generateOTP();

  // Use a transaction so the previous token is consumed and a new token is created atomically
  const created = await prisma.$transaction(async (tx) => {
    await tx.verificationToken.update({
      where: { id: existingToken.id },
      data: { used: true },
    });

    return tx.verificationToken.create({
      data: {
        userId: existingToken.userId,
        code: newOtpCode,
        type: verificationType,
        expiresAt: addMinutes(new Date(), 5),
      },
      select: { id: true },
    });
  });

  try {
    await sendOtpToEmail(existingToken.user.name, existingToken.user.email, newOtpCode);
    return { success: true, data: created };
  } catch (sendErr) {
    // rollback DB changes if sending failed so the attempt isn't consumed
    await prisma.$transaction([
      prisma.verificationToken.delete({ where: { id: created.id } }),
      prisma.verificationToken.update({ where: { id: existingToken.id }, data: { used: false } }),
    ]);
    throw sendErr;
  }
}