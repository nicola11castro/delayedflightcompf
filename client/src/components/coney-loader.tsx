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
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3"
  };

  const textSize = {
    sm: "text-xs",
    md: "text-xs", 
    lg: "text-sm"
  };

  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Côney Assistant Body - Orange Construction Cone */}
        <div 
          className="absolute inset-0 animate-spin flex items-center justify-center"
          style={{
            animationDuration: "2s"
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Main cone body using border triangles like the assistant */}
            <div 
              className="border-l-transparent border-r-transparent"
              style={{
                borderLeftWidth: size === "lg" ? "15px" : size === "md" ? "8px" : "6px",
                borderRightWidth: size === "lg" ? "15px" : size === "md" ? "8px" : "6px", 
                borderBottomWidth: size === "lg" ? "40px" : size === "md" ? "24px" : "16px",
                borderBottomColor: '#f97316'
              }}
            />
            
            {/* Base of cone */}
            <div 
              className="absolute bg-gray-700 rounded-sm"
              style={{
                bottom: size === "lg" ? "-2px" : size === "md" ? "-1px" : "-1px",
                left: "50%",
                transform: "translateX(-50%)",
                width: size === "lg" ? "32px" : size === "md" ? "18px" : "14px",
                height: size === "lg" ? "4px" : size === "md" ? "2px" : "2px"
              }}
            />
            
            {/* White reflective stripes */}
            <div 
              className="absolute bg-white"
              style={{
                bottom: size === "lg" ? "26px" : size === "md" ? "16px" : "10px",
                left: "50%",
                transform: "translateX(-50%)",
                width: size === "lg" ? "24px" : size === "md" ? "14px" : "10px",
                height: size === "lg" ? "3px" : size === "md" ? "2px" : "1px"
              }}
            />
            <div 
              className="absolute bg-white"
              style={{
                bottom: size === "lg" ? "16px" : size === "md" ? "10px" : "6px",
                left: "50%",
                transform: "translateX(-50%)",
                width: size === "lg" ? "20px" : size === "md" ? "12px" : "8px",
                height: size === "lg" ? "3px" : size === "md" ? "2px" : "1px"
              }}
            />
            <div 
              className="absolute bg-white"
              style={{
                bottom: size === "lg" ? "6px" : size === "md" ? "4px" : "2px",
                left: "50%",
                transform: "translateX(-50%)",
                width: size === "lg" ? "16px" : size === "md" ? "10px" : "6px",
                height: size === "lg" ? "3px" : size === "md" ? "2px" : "1px"
              }}
            />
          </div>
        </div>

        {/* Googly eyes matching assistant design */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`flex ${size === "lg" ? "gap-1 -mt-1" : size === "md" ? "gap-0.5 -mt-1" : "gap-0.5 -mt-1"}`}>
            {/* Left googly eye */}
            <div 
              className={cn("relative bg-white rounded-full border border-gray-600", eyeSize[size])}
              style={{
                boxShadow: "inset 1px 1px 1px rgba(255,255,255,0.8), inset -1px -1px 1px rgba(0,0,0,0.2)"
              }}
            >
              <div 
                className="absolute bg-black rounded-full"
                style={{
                  width: "60%",
                  height: "60%",
                  animation: "eyeMovementLeft 1.5s ease-in-out infinite"
                }}
              />
            </div>
            
            {/* Right googly eye */}
            <div 
              className={cn("relative bg-white rounded-full border border-gray-600", eyeSize[size])}
              style={{
                boxShadow: "inset 1px 1px 1px rgba(255,255,255,0.8), inset -1px -1px 1px rgba(0,0,0,0.2)"
              }}
            >
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