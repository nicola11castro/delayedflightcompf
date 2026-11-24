import { useState, useEffect } from "react";
import { X, MessageCircle, HelpCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReasonStatus, calculateCompensation } from "@shared/appr";
import { useLang } from "@/i18n";
import type { TranslationKey } from "@/i18n/en";

interface ClippyMessage {
  id: string;
  context: string;
  trigger?: string;
  icon?: 'info' | 'warning' | 'success';
}

const clippyMessages: ClippyMessage[] = [
  {
    id: "welcome",
    context: "general",
  },
  {
    id: "claim-start",
    context: "claim-form",
    trigger: "step-1"
  },
  {
    id: "documentation",
    context: "claim-form",
    trigger: "step-2"
  },
  {
    id: "commission-info",
    context: "calculator"
  },
  {
    id: "poa-explanation",
    context: "claim-form",
    trigger: "step-3"
  },
  {
    id: "delay-tip",
    context: "general"
  },
  {
    id: "tracking-help",
    context: "track"
  },
  {
    id: "faq-tip",
    context: "faq"
  },
  {
    id: "easter-egg",
    context: "general"
  },
  {
    id: "delay-reason-valid",
    context: "smart-tip"
  },
  {
    id: "delay-reason-invalid",
    context: "smart-tip"
  },
  {
    id: "airline-large",
    context: "smart-tip"
  },
  {
    id: "airline-small",
    context: "smart-tip"
  }
];

export function ClippyAssistant() {
  const { t } = useLang();
  const text = (message: ClippyMessage) => t(`clippy.${message.id}` as TranslationKey);
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
      const isValid = getReasonStatus(formData.delayReason) !== "inadmissible";
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
        title={t("clippy.show")}
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
          title={t("clippy.clickHelp")}
        >
          {/* Orange Construction Cone Character */}
          <div className="relative">
            <div className="w-8 h-10 relative">
              {/* Main cone body - orange */}
              <div 
                className="absolute bottom-0 left-1 border-l-[12px] border-r-[12px] border-b-[32px] border-l-transparent border-r-transparent border-b-orange-500"
                style={{ borderBottomColor: '#f97316' }}
              ></div>
              
              {/* Base of cone */}
              <div 
                className="absolute bottom-0 left-0 w-8 h-2 bg-gray-600 border border-black"
              ></div>
              
              {/* White reflective stripes */}
              <div className="absolute bottom-4 left-2 w-4 h-1 bg-white border-y border-black"></div>
              <div className="absolute bottom-6 left-2.5 w-3 h-1 bg-white border-y border-black"></div>
              
              {/* Googly eyes */}
              <div className="absolute top-2 left-2 w-3 h-3 bg-white border-2 border-black rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
              </div>
              <div className="absolute top-2 left-4.5 w-3 h-3 bg-white border-2 border-black rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
              </div>
              
              {/* Little smile */}
              <div className="absolute top-5 left-3 w-2 h-0 border-b-2 border-black rounded-full"></div>
            </div>
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
                {!currentMessage.icon && <span className="mr-1">🚧</span>}
                {t("clippy.name")}
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
              {text(currentMessage)}
            </p>
            
            <div className="flex justify-between items-center">
              <Button
                onClick={nextMessage}
                variant="outline"
                size="sm"
                className="text-xs py-1 px-2"
              >
                {t("clippy.moreTips")}
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