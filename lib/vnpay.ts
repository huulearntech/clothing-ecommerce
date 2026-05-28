import "dotenv/config";
import { VNPay, HashAlgorithm } from "vnpay";
import { headers } from "next/headers";
import moment from "moment";
import crypto from "crypto";
import qs from "qs";

// Export configuration for server-side use only
export const vnpayConfig = {
  tmnCode: process.env.VNPAY_TMN_CODE!,
  secureSecret: process.env.VNPAY_SECURE_SECRET!,
  vnpayHost: process.env.VNPAY_HOST!,
  testMode: process.env.VNPAY_TEST_MODE! === "true",
  returnUrl: process.env.VNPAY_RETURN_URL!,
};

// Initialize VNPay instance
export const vnpay = new VNPay({
  tmnCode: vnpayConfig.tmnCode,
  secureSecret: vnpayConfig.secureSecret,
  vnpayHost: vnpayConfig.vnpayHost,
  testMode: vnpayConfig.testMode,
  hashAlgorithm: HashAlgorithm.SHA256,
  enableLog: true,
});


export async function createVnpayUrl (totalAmount: number, orderId: string) {
  try {
    // 3. Tạo dữ liệu VNPAY
    const createDate = moment().format('YYYYMMDDHHmmss');
    const amount = Math.round(totalAmount);

    const clientIPAddr = await headers().then(getClientIP);

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpayConfig.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: vnpayConfig.returnUrl,
      vnp_IpAddr: clientIPAddr,
      vnp_CreateDate: createDate,
    };

    // 4. Ký và tạo link
    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.secureSecret);
    const signed = hmac.update(signData).digest('hex');

    sortedParams['vnp_SecureHash'] = signed;

    const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    // Tạo URL
    const paymentUrl = `${vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`;
    return paymentUrl;
  } catch (err) {
    console.error('Error creating VNPay URL:', err);
  }
};


function getClientIP (headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  const clientIP = headers.get("x-client-ip");
  return realIP || clientIP || "127.0.0.1";
};
const sortObject = <T extends Record<string, string | number>>(obj: T): Record<string, string> => {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();

  keys.forEach((key) => {
    const value = obj[key];
    sorted[encodeURIComponent(key)] = encodeURIComponent(String(value)).replace(/%20/g, "+");
  });

  return sorted;
};
