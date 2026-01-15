import { useEffect, useRef, useState, memo } from "react";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  earnings: string;
  channels: string;
  growth: string;
  quote: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

// Optimized: Uses CSS animations for GPU acceleration
// Only animates when visible via Intersection Observer
export const TestimonialCarousel = memo(({ testimonials }: TestimonialCarouselProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate for seamless loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  // Intersection Observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const shouldAnimate = isVisible && !isPaused;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <style>{`
        @keyframes scrollTestimonials {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .testimonial-track {
          animation: scrollTestimonials 60s linear infinite;
          will-change: transform;
        }
        .testimonial-paused {
          animation-play-state: paused;
        }
      `}</style>

      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      <div 
        className={`flex gap-8 py-4 testimonial-track ${!shouldAnimate ? 'testimonial-paused' : ''}`}
        style={{ width: 'max-content' }}
      >
        {duplicatedTestimonials.map((testimonial, index) => (
          <Card 
            key={index} 
            className="p-8 bg-card border-border flex-shrink-0 w-[400px] flex flex-col hover:border-primary/30 transition-colors"
          >
            <p className="text-muted-foreground italic flex-1 text-lg leading-relaxed">"{testimonial.quote}"</p>
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                  {testimonial.earnings}
                </span>
                <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
                  {testimonial.channels}
                </span>
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm border border-green-500/20">
                  {testimonial.growth}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="font-semibold text-foreground">{testimonial.name}</p>
              <p className="text-muted-foreground text-sm">{testimonial.role}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
});

TestimonialCarousel.displayName = 'TestimonialCarousel';
