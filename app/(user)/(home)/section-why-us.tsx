import Image from "next/image"
import { Calendar, ClockFading, Star, UserCheck } from "lucide-react"
import { app_store, play_store } from "@/public/logos"


export default function WhyUsSection() {
  return (
    <section>
      <div className="flex flex-col lg:flex-row gap-4 content">
        <div className="lg:w-1/4 gap-y-2">
          <div className="box-border wrap-break-word whitespace-pre-wrap text-center lg:text-start font-semibold text-[26px]">
            50M+ lượt tải xuống, 1M+ đánh giá
          </div>
          <div className="h-6 flex justify-center lg:justify-start gap-x-6">
            <div className="flex">
              <Image
                src={app_store}
                alt="App Store"
                className="mr-2 h-6"
              />
              <div className="inline-flex items-center font-semibold">
                4.6
                <Star className="size-3 fill-current ml-1" />
              </div>
            </div>
            <div className="flex">
              <Image
                src={play_store}
                alt="Play Store"
                className="mr-2 h-6"
              />
              <div className="inline-flex items-center font-semibold">
                4.7
                <Star className="size-3 fill-current ml-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex lg:w-1/3 p-4 gap-x-3 border rounded-[10px]">
          <Calendar className="size-6 mt-2" />
          <div className="flex flex-col flex-1 gap-y-1">
            <h3 className="font-semibold">Hủy miễn phí</h3>
            <p>Hủy hoặc nhận hoàn tiền bất cứ khi nào bạn cần thay đổi kế hoạch.</p>
          </div>

        </div>
        <div className="flex lg:w-1/3 p-4 gap-x-3 border rounded-[10px]">
          <UserCheck className="size-6 mt-2" />
          <div className="flex flex-col flex-1 gap-y-1">
            <h3 className="font-semibold">Nhiều phương thức thanh toán an toàn</h3>
            <p>Nhiều lựa chọn thanh toán toàn cầu đáng tin cậy dành cho bạn.</p>
          </div>

        </div>
        <div className="flex lg:w-1/3 p-4 gap-x-3 border rounded-[10px]">
          <ClockFading className="size-6 mt-2" />
          <div className="flex flex-col flex-1 gap-y-1">
            <h3 className="font-semibold">Trung tâm hỗ trợ 24/7</h3>
            <p>Bạn có thể liên hệ với chúng tôi bất cứ lúc nào cần hỗ trợ.</p>
          </div>
        </div>
      </div>
    </section>
  )
};