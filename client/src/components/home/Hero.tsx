import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

const heroSlides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&h=600&fit=crop&q=80",
    title: "홈 인테리어",
    subtitle: "세련된 감각의 홈스타일링",
    link: "/products/home_interior",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&h=600&fit=crop&q=80",
    title: "뷰티",
    subtitle: "트렌디한 뷰티 & 스킨케어",
    link: "/products/beauty",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=1600&h=600&fit=crop&q=80",
    title: "가전/디지털",
    subtitle: "스마트한 라이프를 위한 기기",
    link: "/products/electronics",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=600&fit=crop&q=80",
    title: "생활용품",
    subtitle: "일상을 더 편리하게",
    link: "/products/living",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&h=600&fit=crop&q=80",
    title: "헬스/건강식품",
    subtitle: "건강한 삶을 위한 웰니스",
    link: "/products/health",
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1549439602-43ebca2327af?w=1600&h=600&fit=crop&q=80",
    title: "럭셔리/명품",
    subtitle: "프리미엄 명품 컬렉션",
    link: "/products/luxury",
  },
  {
    id: 7,
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1600&h=600&fit=crop&q=80",
    title: "유아/완구",
    subtitle: "아이를 위한 안전한 제품",
    link: "/products/baby",
  },
];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  return (
    <section className="relative w-full h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px] overflow-hidden bg-gray-100">
      {heroSlides.map((slide, index) => (
        <a
          href={slide.link}
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100 z-[1]" : "opacity-0 z-0"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{slide.title}</h2>
            <p className="text-sm sm:text-base md:text-lg opacity-90">{slide.subtitle}</p>
          </div>
        </a>
      ))}

      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors z-10"
        data-testid="button-hero-prev"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors z-10"
        data-testid="button-hero-next"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentSlide ? "bg-white" : "bg-white/50"
            }`}
            data-testid={`button-hero-dot-${index}`}
          />
        ))}
      </div>
    </section>
  );
}
