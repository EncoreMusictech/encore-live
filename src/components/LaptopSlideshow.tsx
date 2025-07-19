import { useState, useEffect } from "react";
import laptopMockup from "@/assets/laptop-mockup.png";
import copyrightDashboard from "@/assets/copyright-dashboard.png";
import royaltiesDashboard from "@/assets/royalties-dashboard.png";
import contractsDashboard from "@/assets/contracts-dashboard.png";
import syncLicensingDashboard from "@/assets/sync-licensing-dashboard.png";

const slides = [
  {
    image: copyrightDashboard,
    title: "Copyright Management",
    description: "Track and manage your music copyrights"
  },
  {
    image: royaltiesDashboard,
    title: "Royalties Analytics",
    description: "Monitor earnings and payment distributions"
  },
  {
    image: contractsDashboard,
    title: "Contract Management",
    description: "Create and manage legal agreements"
  },
  {
    image: syncLicensingDashboard,
    title: "Sync Licensing",
    description: "Handle sync opportunities and deals"
  }
];

const LaptopSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Laptop base image */}
      <div className="relative">
        <img 
          src={laptopMockup} 
          alt="Laptop showing platform interface" 
          className="w-full h-auto"
        />
        
        {/* Screen content overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[73%] h-[73%] mt-[2%] ml-[0.5%] overflow-hidden rounded-lg">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="flex justify-center space-x-2 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide 
                ? "bg-gradient-primary" 
                : "bg-muted"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Current slide info */}
      <div className="text-center mt-4 space-y-2">
        <h3 className="text-xl font-semibold">{slides[currentSlide].title}</h3>
        <p className="text-muted-foreground">{slides[currentSlide].description}</p>
      </div>
    </div>
  );
};

export default LaptopSlideshow;