import { cn } from "@/lib/utils";

interface ConeyLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ConeyLoader({ className, size = "md" }: ConeyLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-20 h-20"
  };

  const eyeSize = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2.5 h-2.5"
  };

  const textSize = {
    sm: "text-xs",
    md: "text-xs", 
    lg: "text-sm"
  };

  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Côney cone body - orange construction cone with Montreal vibes */}
        <div 
          className="absolute inset-0 animate-spin win98-border"
          style={{
            background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff6b35 100%)",
            clipPath: "polygon(50% 0%, 15% 100%, 85% 100%)",
            borderRadius: "2px 2px 4px 4px",
            animationDuration: "2s",
            boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.8), inset -1px -1px 0 rgba(0,0,0,0.3)"
          }}
        >
          {/* White reflective stripes with Windows 98 styling */}
          <div 
            className="absolute w-full bg-white opacity-90 win98-border"
            style={{ 
              top: "30%", 
              height: size === "lg" ? "3px" : size === "md" ? "2px" : "1px",
              boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(0,0,0,0.2)"
            }}
          />
          <div 
            className="absolute w-full bg-white opacity-90 win98-border"
            style={{ 
              top: "60%", 
              height: size === "lg" ? "3px" : size === "md" ? "2px" : "1px",
              boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(0,0,0,0.2)"
            }}
          />
        </div>

        {/* Googly eyes container with Windows 98 styling */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`flex mt-1 ${size === "lg" ? "gap-1" : "gap-0.5"}`}>
            {/* Left googly eye with win98 border */}
            <div 
              className={cn("relative bg-white rounded-full win98-border", eyeSize[size])}
              style={{
                boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(0,0,0,0.3), 1px 1px 2px rgba(0,0,0,0.2)"
              }}
            >
              <div 
                className="absolute bg-black rounded-full"
                style={{
                  width: "60%",
                  height: "60%",
                  animation: "eyeMovementLeft 1.2s ease-in-out infinite",
                  boxShadow: "1px 1px 1px rgba(0,0,0,0.3)"
                }}
              />
            </div>
            
            {/* Right googly eye with win98 border */}
            <div 
              className={cn("relative bg-white rounded-full win98-border", eyeSize[size])}
              style={{
                boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(0,0,0,0.3), 1px 1px 2px rgba(0,0,0,0.2)"
              }}
            >
              <div 
                className="absolute bg-black rounded-full"
                style={{
                  width: "60%",
                  height: "60%",
                  animation: "eyeMovementRight 1.2s ease-in-out infinite",
                  boxShadow: "1px 1px 1px rgba(0,0,0,0.3)"
                }}
              />
            </div>
          </div>
        </div>

        {/* Loading text (optional) */}
        {size !== "lg" && (
          <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 ${textSize[size]} text-muted-foreground whitespace-nowrap`}>
            Côney at work...
          </div>
        )}
      </div>
    </div>
  );
}

// Alternative version with more elaborate eye movement
export function ConeyLoaderAdvanced({ className, size = "md" }: ConeyLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  };

  const eyeSize = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2 h-2"
  };

  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Animated cone with clock-like rotation */}
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff6b35 100%)",
            clipPath: "polygon(50% 0%, 15% 100%, 85% 100%)",
            borderRadius: "2px 2px 4px 4px",
            animation: "spin 2s linear infinite"
          }}
        >
          {/* Reflective stripes */}
          <div className="absolute w-full h-0.5 bg-white opacity-80" style={{ top: "30%" }} />
          <div className="absolute w-full h-0.5 bg-white opacity-80" style={{ top: "60%" }} />
        </div>

        {/* Advanced googly eyes */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-0.5 mt-1">
            {/* Left eye with circular motion */}
            <div className={cn("relative bg-white rounded-full border border-gray-300", eyeSize[size])}>
              <div 
                className="absolute bg-black rounded-full"
                style={{
                  width: "60%",
                  height: "60%",
                  animation: "eyeMovementLeft 1.5s ease-in-out infinite"
                }}
              />
            </div>
            
            {/* Right eye with opposite circular motion */}
            <div className={cn("relative bg-white rounded-full border border-gray-300", eyeSize[size])}>
              <div 
                className="absolute bg-black rounded-full"
                style={{
                  width: "60%",
                  height: "60%",
                  animation: "eyeMovementRight 1.5s ease-in-out infinite"
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes eyeMovementLeft {
          0% { top: 20%; left: 20%; }
          25% { top: 10%; left: 30%; }
          50% { top: 20%; left: 40%; }
          75% { top: 30%; left: 30%; }
          100% { top: 20%; left: 20%; }
        }
        
        @keyframes eyeMovementRight {
          0% { top: 20%; left: 40%; }
          25% { top: 30%; left: 30%; }
          50% { top: 20%; left: 20%; }
          75% { top: 10%; left: 30%; }
          100% { top: 20%; left: 40%; }
        }
      `}</style>
    </div>
  );
}