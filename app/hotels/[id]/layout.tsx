import Header from "@/components/header"
import Footer from "@/components/footer"

import type { Metadata } from "next";
import prisma from "@/lib/prisma";

export default function Layout ({
  children
} : {
  children: React.ReactNode
}) {
  return (
    <>
      <Header className="static border-b border-2" />
      {children}
      <Footer />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: hotelId } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });

  if (!hotel) return { title: "Hotel not found" };
  
  return {
    title: hotel.name,
    description: hotel.description ?? undefined,
    openGraph: {
      title: hotel.name,
      description: hotel.description ?? undefined,
      images: [
        {
          url: hotel.imageUrls[0],
          alt: hotel.name,
        },
      ],
    },
  };
}