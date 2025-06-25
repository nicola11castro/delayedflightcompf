import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronDown, Search, Mic, Bot, MessageCircle, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { voiceSearchService } from "@/lib/voice-search";
import type { FaqItem } from "@shared/schema";

interface ChatbotResponse {
  message: string;
  isHelpful: boolean;
}

export function FaqSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotResponse, setChatbotResponse] = useState<ChatbotResponse | null>(null);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: faqs, isLoading } = useQuery<FaqItem[]>({
    queryKey: ["/api/faqs", searchQuery],
  });

  const chatbotMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/chatbot', { query });
      return response.json();
    },
    onSuccess: (data: ChatbotResponse) => {
      setChatbotResponse(data);
      setShowChatbot(true);
    },
    onError: () => {
      toast({
        title: "AI Assistant Unavailable",
        description: "Please try again later or contact our support team.",
        variant: "destructive",
      });
    },
  });

  const voiceSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      return voiceSearchService.searchFAQs(query);
    },
    onSuccess: (data) => {
      if (data.type === 'faq' && data.faqs) {
        // Update search query to show relevant FAQs
        setSearchQuery(data.faqs[0]?.question.substring(0, 20) || "");
      } else if (data.type === 'chatbot') {
        setChatbotResponse({ message: data.response, isHelpful: true });
        setShowChatbot(true);
      }
    },
    onError: () => {
      toast({
        title: "Voice Search Failed",
        description: "Please try typing your question instead.",
        variant: "destructive",
      });
    },
  });

  const handleVoiceSearch = async () => {
    if (!voiceSearchService.isSupportedBrowser()) {
      toast({
        title: "Voice Search Not Supported",
        description: "Please use a modern browser with voice recognition support.",
        variant: "destructive",
      });
      return;
    }

    if (isVoiceRecording) {
      voiceSearchService.stopListening();
      setIsVoiceRecording(false);
      return;
    }

    try {
      setIsVoiceRecording(true);
      const result = await voiceSearchService.startListening();
      setSearchQuery(result.transcript);
      voiceSearchMutation.mutate(result.transcript);
    } catch (error) {
      toast({
        title: "Voice Recognition Error",
        description: "Please try again or type your question.",
        variant: "destructive",
      });
    } finally {
      setIsVoiceRecording(false);
    }
  };

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleChatbotQuery = () => {
    if (searchQuery.trim()) {
      chatbotMutation.mutate(searchQuery);
    }
  };

  // Default FAQs if none loaded
  const defaultFaqs: FaqItem[] = [
    {
      id: 1,
      question: "How does the 15% commission work?",
      answer: "We only charge our 15% commission if your claim is successful. If you receive $700 in compensation, we deduct $105 (15%) and transfer $595 to you. If your claim is unsuccessful, you pay nothing.",
      category: "commission",
      order: 1,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 2,
      question: "What's the difference between POA and regular claims?",
      answer: "With a Power of Attorney (POA), we collect compensation directly from the airline, deduct our 15% commission, and transfer the rest to you immediately. Without POA, the airline pays you directly, and we invoice you for the 15% commission afterward.",
      category: "process",
      order: 2,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 3,
      question: "Are there any hidden fees besides the 15%?",
      answer: "No hidden fees. Our 15% commission is the only charge, and it's only collected if your claim succeeds. There are no upfront costs, processing fees, or additional charges.",
      category: "fees",
      order: 3,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 4,
      question: "How long does the commission process take?",
      answer: "With POA: Commission is deducted automatically and remaining funds transferred within 1-2 business days of receiving airline payment. Without POA: We send a commission invoice within 24 hours of your compensation receipt.",
      category: "timing",
      order: 4,
      isActive: true,
      createdAt: new Date(),
    },
  ];

  const displayFaqs = faqs || defaultFaqs;
  const filteredFaqs = searchQuery
    ? displayFaqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayFaqs;

  return (
    <section id="faq" className="py-20 bg-white dark:bg-dark-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-inter font-bold text-3xl lg:text-4xl text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Common questions about our 15% commission structure
          </p>
          
          {/* Search Input with Voice */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search FAQs or ask a question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatbotQuery()}
                className="w-full pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleChatbotQuery}
                  disabled={!searchQuery.trim() || chatbotMutation.isPending}
                  className="h-8 w-8"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceSearch}
                  disabled={voiceSearchMutation.isPending}
                  className={`h-8 w-8 ${isVoiceRecording ? 'voice-recording text-red-500' : ''}`}
                >
                  {isVoiceRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {isVoiceRecording && (
              <div className="mt-2 text-center">
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  🎤 Listening... Click mic to stop
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Chatbot Response */}
        {showChatbot && chatbotResponse && (
          <Card className="mb-8 border-2 border-primary/20 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    AI Assistant Response
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {chatbotResponse.message}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChatbot(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading FAQs...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <Card key={faq.id} className="border border-gray-200 dark:border-gray-600">
                <Button
                  variant="ghost"
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 h-auto"
                  onClick={() => toggleFaq(faq.id)}
                >
                  <span className="font-medium text-gray-900 dark:text-white text-left">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`h-4 w-4 text-gray-400 transform transition-transform duration-200 flex-shrink-0 ml-4 ${
                      expandedFaq === faq.id ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
                {expandedFaq === faq.id && (
                  <CardContent className="px-6 pb-4 pt-0">
                    <p className="text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}

            {filteredFaqs.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No FAQs found for "{searchQuery}". Try asking our AI assistant!
                </p>
                <Button 
                  onClick={handleChatbotQuery}
                  disabled={chatbotMutation.isPending}
                  className="btn-primary"
                >
                  {chatbotMutation.isPending ? (
                    <>
                      <div className="spinner mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Ask AI Assistant
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* AI Chatbot Integration */}
        <div className="mt-12 bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-2xl p-8 text-center">
          <h3 className="font-inter font-semibold text-xl text-gray-900 dark:text-white mb-4">
            <Bot className="inline w-6 h-6 text-primary mr-2" />
            Still have questions about our commission?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our AI assistant can answer specific questions about fees, processing times, and commission calculations.
          </p>
          <Button 
            onClick={() => {
              if (searchInputRef.current) {
                searchInputRef.current.focus();
              }
            }}
            className="btn-primary"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Ask Our AI Assistant
          </Button>
        </div>
      </div>
    </section>
  );
}
