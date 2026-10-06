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
import { useLang } from "@/i18n";

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
  const { t } = useLang();
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
        title: t("faq.unavailable"),
        description: t("faq.unavailableDesc"),
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
        title: t("faq.voiceFailed"),
        description: t("faq.voiceFailedDesc"),
        variant: "destructive",
      });
    },
  });

  const handleVoiceSearch = async () => {
    if (!voiceSearchService.isSupportedBrowser()) {
      toast({
        title: t("faq.voiceUnsupported"),
        description: t("faq.voiceUnsupportedDesc"),
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
        title: t("faq.voiceError"),
        description: t("faq.voiceErrorDesc"),
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
      question: t("faq.q1"),
      answer: t("faq.a1"),
      category: "commission",
      order: 1,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 2,
      question: t("faq.q2"),
      answer: t("faq.a2"),
      category: "process",
      order: 2,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 3,
      question: t("faq.q3"),
      answer: t("faq.a3"),
      category: "fees",
      order: 3,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 4,
      question: t("faq.q4"),
      answer: t("faq.a4"),
      category: "timing",
      order: 4,
      isActive: true,
      createdAt: new Date(),
    },
  ];

  const displayFaqs = faqs && faqs.length > 0 ? faqs : defaultFaqs;
  const filteredFaqs = searchQuery
    ? displayFaqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayFaqs;

  return (
    <section id="faq" className="py-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-bold text-2xl mb-4">{t("faq.title")}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t("faq.lead")}</p>
          
          {/* Search Input with Voice */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={t("faq.placeholder")}
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
                  {t("faq.listening")}
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
                  <h4 className="font-semibold mb-2">
                    {t("faq.assistant")}
                  </h4>
                  <p className="mb-3">
                    {chatbotResponse.message}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChatbot(false)}
                  >
                    {t("faq.close")}
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
            <p className="text-muted-foreground">{t("faq.loading")}</p>
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
                  <span className="font-medium text-left">
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
                    <p className="text-muted-foreground">
                      {faq.answer}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}

            {filteredFaqs.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {t("faq.noResults", { q: searchQuery })}
                </p>
                <Button 
                  onClick={handleChatbotQuery}
                  disabled={chatbotMutation.isPending}
                  className="btn-primary"
                >
                  {chatbotMutation.isPending ? (
                    <>
                      <div className="spinner mr-2"></div>
                      {t("faq.processing")}
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {t("faq.askButton")}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* AI Chatbot Integration */}
        <div className="mt-12 win98-panel p-8 text-center">
          <h3 className="font-semibold text-lg mb-4">
            <Bot className="inline w-6 h-6 text-primary mr-2" />
            {t("faq.stillTitle")}
          </h3>
          <p className="text-muted-foreground mb-6">{t("faq.stillLead")}</p>
          <Button 
            onClick={() => {
              if (searchInputRef.current) {
                searchInputRef.current.focus();
              }
            }}
            className="btn-primary"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {t("faq.askButton")}
          </Button>
        </div>
      </div>
    </section>
  );
}
