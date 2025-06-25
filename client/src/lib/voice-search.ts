interface VoiceSearchResult {
  transcript: string;
  confidence: number;
}

interface VoiceSearchOptions {
  language?: string;
  maxResults?: number;
  continuous?: boolean;
}

export class VoiceSearchService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean;
  private isListening: boolean = false;

  constructor() {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (this.isSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
  }

  public async startListening(options: VoiceSearchOptions = {}): Promise<VoiceSearchResult> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported || !this.recognition) {
        reject(new Error('Speech recognition is not supported in this browser'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      // Apply options
      if (options.language) {
        this.recognition.lang = options.language;
      }
      if (options.continuous !== undefined) {
        this.recognition.continuous = options.continuous;
      }

      this.isListening = true;

      this.recognition.onresult = (event) => {
        const result = event.results[0];
        if (result.isFinal) {
          this.isListening = false;
          resolve({
            transcript: result[0].transcript.trim(),
            confidence: result[0].confidence,
          });
        }
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public isSupportedBrowser(): boolean {
    return this.isSupported;
  }

  public async searchFAQs(query: string): Promise<any> {
    try {
      const response = await fetch('/api/voice-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Voice search request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Voice search API error:', error);
      throw error;
    }
  }
}

export const voiceSearchService = new VoiceSearchService();
