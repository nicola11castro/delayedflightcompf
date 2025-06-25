import { useState, useEffect } from "react";
import { X, MessageCircle, HelpCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDelayReasonValidity, calculateCompensation } from "@/data/airlines";

interface ClippyMessage {
  id: string;
  text: string;
  context: string;
  trigger?: string;
  icon?: 'info' | 'warning' | 'success';
}

const clippyMessages: ClippyMessage[] = [
  {
    id: "welcome",
    text: "✈️ Hi there! I'm your friendly flight compensation assistant. I've helped thousands of passengers get compensation for delays. Ready to take off?",
    context: "general",
  },
  {
    id: "claim-start",
    text: "Great! You're starting a claim. Pro tip: Have your boarding pass, flight confirmation, and any delay notifications ready for faster processing.",
    context: "claim-form",
    trigger: "step-1"
  },
  {
    id: "documentation",
    text: "Document everything! Upload clear photos of your boarding pass, delay announcements, meal vouchers, and hotel receipts if provided by the airline.",
    context: "claim-form",
    trigger: "step-2"
  },
  {
    id: "commission-info",
    text: "Our transparent 15% commission is only charged when we WIN your case. No success = No fee. You keep 85% of all compensation!",
    context: "calculator"
  },
  {
    id: "poa-explanation",
    text: "The Power of Attorney is standard practice and allows us to negotiate directly with airlines. It's secure and can be revoked anytime!",
    context: "claim-form",
    trigger: "step-3"
  },
  {
    id: "delay-tip",
    text: "Flight wisdom: EU flights delayed 3+ hours qualify for €250-€600 compensation. US domestic delays over 3 hours may qualify for $300-$700!",
    context: "general"
  },
  {
    id: "tracking-help",
    text: "Lost your claim details? No worries! Use your Claim ID or email to track progress. We'll also send regular updates to your inbox.",
    context: "track"
  },
  {
    id: "faq-tip",
    text: "Got questions? I've helped thousands of passengers get compensation. Check our FAQ or ask me directly - I know all the airline tricks!",
    context: "faq"
  },
  {
    id: "easter-egg",
    text: "✈️ You found the hidden assistant! I'm a cute little airplane here to guide you through compensation claims. Ready for takeoff? 🛫",
    context: "general"
  },
  {
    id: "delay-reason-valid",
    text: "Good news! This delay reason typically qualifies for compensation. Airlines are responsible for crew issues, maintenance, and operational problems.",
    context: "smart-tip"
  },
  {
    id: "delay-reason-invalid",
    text: "Heads up! This delay reason is usually considered 'extraordinary circumstances' - airlines typically aren't required to pay compensation for weather, ATC, or security issues.",
    context: "smart-tip"
  },
  {
    id: "airline-large",
    text: "You're dealing with a large airline! They typically offer higher compensation rates ($400-$1000) but may have more complex claim processes.",
    context: "smart-tip"
  },
  {
    id: "airline-small",
    text: "This is a smaller airline with lower compensation rates ($125-$500), but they often have simpler claim processes and faster response times.",
    context: "smart-tip"
  }
];

export function ClippyAssistant() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<ClippyMessage>(clippyMessages[0]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [smartTips, setSmartTips] = useState<ClippyMessage[]>([]);

  // Show Clippy after a delay on first visit
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasShownWelcome) {
        setIsVisible(true);
        setIsExpanded(true);
        setHasShownWelcome(true);
        
        // Auto-collapse after showing welcome message
        setTimeout(() => {
          setIsExpanded(false);
        }, 5000);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [hasShownWelcome]);

  // Context-based message triggers
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['claims', 'calculator', 'track', 'faq'];
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;
          const elementBottom = elementTop + rect.height;

          if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
            const contextMessage = clippyMessages.find(msg => 
              msg.context === sectionId || 
              (sectionId === 'claims' && msg.context === 'claim-form')
            );
            
            if (contextMessage && contextMessage.id !== currentMessage.id) {
              setCurrentMessage(contextMessage);
              if (isVisible && !isExpanded) {
                // Briefly expand to show new context message
                setIsExpanded(true);
                setTimeout(() => setIsExpanded(false), 3000);
              }
            }
          }
        }
      });
    };

    // Handle custom Clippy trigger events
    const handleClippyTrigger = (event: CustomEvent) => {
      const { trigger, context, data } = event.detail;
      
      // Handle smart tips based on form data
      if (data) {
        const tips = generateSmartTips(data);
        if (tips.length > 0) {
          setSmartTips(tips);
          setCurrentMessage(tips[0]);
          setIsVisible(true);
          setIsExpanded(true);
          setTimeout(() => setIsExpanded(false), 5000);
          return;
        }
      }
      
      const triggerMessage = clippyMessages.find(msg => 
        msg.trigger === trigger && msg.context === context
      );
      
      if (triggerMessage) {
        setCurrentMessage(triggerMessage);
        setIsVisible(true);
        setIsExpanded(true);
        setTimeout(() => setIsExpanded(false), 4000);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('clippyTrigger', handleClippyTrigger as EventListener);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('clippyTrigger', handleClippyTrigger as EventListener);
    };
  }, [currentMessage.id, isVisible, isExpanded]);

  const toggleClippy = () => {
    if (!isVisible) {
      setIsVisible(true);
      setIsExpanded(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const generateSmartTips = (formData: any): ClippyMessage[] => {
    const tips: ClippyMessage[] = [];
    
    // Check delay reason validity
    if (formData.delayReason) {
      const isValid = getDelayReasonValidity(formData.delayReason);
      const reasonTip = clippyMessages.find(msg => 
        msg.id === (isValid ? 'delay-reason-valid' : 'delay-reason-invalid')
      );
      if (reasonTip) {
        tips.push({
          ...reasonTip,
          icon: isValid ? 'success' : 'warning'
        });
      }
    }
    
    // Check airline category
    if (formData.airline || formData.flightNumber) {
      const airlineName = formData.airline || formData.flightNumber.substring(0, 2);
      const compensation = calculateCompensation(airlineName, 3);
      
      if (compensation.eligible) {
        const airlineTip = clippyMessages.find(msg => 
          msg.id === (compensation.amount >= 400 ? 'airline-large' : 'airline-small')
        );
        if (airlineTip) {
          tips.push({
            ...airlineTip,
            icon: 'info'
          });
        }
      }
    }
    
    return tips;
  };

  const nextMessage = () => {
    if (smartTips.length > 0) {
      const currentTipIndex = smartTips.findIndex(tip => tip.id === currentMessage.id);
      const nextTipIndex = (currentTipIndex + 1) % smartTips.length;
      setCurrentMessage(smartTips[nextTipIndex]);
    } else {
      const nextIndex = (messageIndex + 1) % clippyMessages.length;
      setMessageIndex(nextIndex);
      setCurrentMessage(clippyMessages[nextIndex]);
    }
  };

  const closeClippy = () => {
    setIsExpanded(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) {
    return (
      <Button
        onClick={toggleClippy}
        className="fixed bottom-4 right-4 z-50 win98-button text-xs"
        title="Show Assistant"
      >
        <HelpCircle className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Clippy Character */}
      <div 
        className={`relative transition-all duration-300 ${
          isExpanded ? 'mb-2' : ''
        }`}
      >
        <div 
          onClick={toggleClippy}
          className="w-16 h-16 win98-panel cursor-pointer hover:brightness-110 transition-all duration-200 flex items-center justify-center clippy-character"
          title="Click for flight compensation help!"
        >
          {/* Cute Airplane Character */}
          <div className="relative">
            {/* Main fuselage */}
            <div className="w-10 h-4 bg-accent border-2 border-black rounded-full flex items-center justify-center relative">
              {/* Cockpit windows */}
              <div className="w-2 h-1 bg-black rounded-full mr-2"></div>
              <div className="w-1 h-1 bg-black rounded-full"></div>
            </div>
            
            {/* Wings */}
            <div className="absolute top-1 -left-2 w-6 h-2 bg-accent border border-black transform -rotate-12"></div>
            <div className="absolute top-1 -right-2 w-6 h-2 bg-accent border border-black transform rotate-12"></div>
            
            {/* Tail */}
            <div className="absolute -bottom-1 right-0 w-3 h-3 bg-accent border border-black transform rotate-45"></div>
            
            {/* Propeller */}
            <div className="absolute top-1.5 -left-4 w-1 h-3 bg-black transform rotate-45 animate-spin"></div>
            <div className="absolute top-1.5 -left-4 w-1 h-3 bg-black transform -rotate-45 animate-spin"></div>
          </div>
        </div>
      </div>

      {/* Message Bubble */}
      <div className={`transition-all duration-300 ${
        isExpanded 
          ? 'opacity-100 transform translate-y-0 scale-100' 
          : 'opacity-0 transform translate-y-2 scale-95 pointer-events-none'
      }`}>
        <div className="win98-panel max-w-xs relative clippy-bubble">
          {/* Speech bubble tail */}
          <div className="absolute bottom-0 right-8 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-400 transform translate-y-full"></div>
          
          <div className="p-3">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-xs font-bold flex items-center">
                {currentMessage.icon === 'warning' && <AlertTriangle className="w-3 h-3 mr-1 text-destructive" />}
                {currentMessage.icon === 'success' && <CheckCircle className="w-3 h-3 mr-1 text-secondary" />}
                {!currentMessage.icon && <span className="mr-1">✈️</span>}
                Flight Assistant
              </h4>
              <Button
                onClick={closeClippy}
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-muted"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            
            <p className="text-xs text-foreground mb-3 leading-relaxed">
              {currentMessage.text}
            </p>
            
            <div className="flex justify-between items-center">
              <Button
                onClick={nextMessage}
                variant="outline"
                size="sm"
                className="text-xs py-1 px-2"
              >
                More Tips
              </Button>
              <span className="text-xs text-muted-foreground">
                {smartTips.length > 0 ? 
                  `Smart Tip ${smartTips.findIndex(tip => tip.id === currentMessage.id) + 1}/${smartTips.length}` :
                  `${messageIndex + 1}/${clippyMessages.length}`
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}