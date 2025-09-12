import { useState } from 'react';
import { Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const topics = ['General Inquiry', 'Consulting Opportunity', 'Other'];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Enhanced security validation using database function
      const { data: validationData, error: validationError } = await supabase.rpc(
        'validate_contact_submission', 
        { 
          _name: formData.name,
          _email: formData.email, 
          _message: formData.message 
        }
      );

      if (validationError) {
        console.error('Validation error:', validationError);
        toast({
          title: "Validation Error",
          description: "There was an error validating your submission. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const validationResult = validationData as unknown as ValidationResult;
      if (!validationResult.valid) {
        const errorMessages = validationResult.errors.join(', ');
        toast({
          title: "Validation Error",
          description: errorMessages,
          variant: "destructive"
        });
        return;
      }

      // Input sanitization for database insertion
      const sanitizedData = {
        name: formData.name.trim().slice(0, 100),
        email: formData.email.trim().toLowerCase().slice(0, 255),
        topic: formData.topic.trim().slice(0, 100),
        message: formData.message.trim().slice(0, 2000)
      };

      // Insert into database with enhanced security policies
      const { error: insertError } = await supabase
        .from('contacts')
        .insert([sanitizedData]);

      if (insertError) {
        // Check if it's a rate limiting error
        if (insertError.message.includes('rate limit') || insertError.message.includes('Rate limit')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait before submitting another message. You can submit up to 5 messages per hour.",
            variant: "destructive"
          });
          return;
        }
        throw insertError;
      }

      // Send notifications (owner + confirmation) with enhanced error handling
      try {
        await supabase.functions.invoke('contact-notify', {
          body: sanitizedData
        });
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
        // Don't fail the entire process if notifications fail
        // The contact was successfully saved
      }

      toast({
        title: "Message sent successfully!",
        description: "Thank you for reaching out. I'll get back to you within 24 hours."
      });
      
      // Clear form on success
      setFormData({
        name: '',
        email: '',
        topic: '',
        message: ''
      });

    } catch (error: any) {
      console.error('Contact submit error:', error);
      
      // Provide more specific error messages
      let errorMessage = "Please try again or contact me directly via email.";
      
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        errorMessage = "It looks like you've already submitted this message recently.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      toast({
        title: "Error sending message",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Seth Gagnon",
    "description": "Get in touch with Seth Gagnon for AI leadership consulting, cloud strategy, and engineering management opportunities.",
    "url": "https://aicloudops.tech/contact",
    "mainEntity": {
      "@type": "Person",
      "name": "Seth Gagnon",
      "email": "sethgagnon@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Boston Area",
        "addressRegion": "MA",
        "addressCountry": "US"
      }
    }
  };
  return <div className="min-h-screen bg-background">
      <SEO title="Contact Seth Gagnon - AI Leadership & Cloud Strategy Consulting" description="Contact Seth Gagnon for strategic insights, collaboration opportunities, and consulting on AI leadership, cloud architecture, and digital transformation projects." keywords="contact Seth Gagnon, AI consulting, cloud strategy consulting, engineering leadership, digital transformation, technology consulting" canonical="https://aicloudops.tech/contact" structuredData={structuredData} />
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-br from-background to-muted/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Let's Start a Conversation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're looking for strategic insights or collaboration on innovative projects, I'd love to hear from you.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Get In Touch
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    I'm always interested in connecting with fellow technology leaders, 
                    discussing innovative solutions, and exploring new opportunities.
                  </p>
                </div>

                {/* Contact Methods */}
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <p className="text-muted-foreground">sethgagnon@gmail.com</p>
                      <p className="text-sm text-muted-foreground">Preferred for detailed discussions</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Location</h3>
                      <p className="text-muted-foreground">Boston Area</p>
                      <p className="text-sm text-muted-foreground">Available for in-person meetings</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-glow/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-primary-glow" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Response Time</h3>
                      <p className="text-muted-foreground">Within 24 hours</p>
                      <p className="text-sm text-muted-foreground">Monday - Friday, 9 AM - 5 PM EST</p>
                    </div>
                  </div>
                </div>

                {/* What to Expect */}
                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-3">What to Expect</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0" />
                      Quick acknowledgment within 24 hours
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0" />
                      Detailed response with next steps
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0" />
                      Professional and personalized communication
                    </li>
                  </ul>
                </div>
              </div>

              {/* Contact Form */}
              <div className="card-elegant">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Full Name *
                    </label>
                    <input type="text" id="name" name="name" required maxLength={100} value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300" placeholder="Your full name" />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email Address *
                    </label>
                    <input type="email" id="email" name="email" required maxLength={255} value={formData.email} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300" placeholder="your.email@company.com" />
                  </div>

                  <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-foreground mb-2">
                      Topic
                    </label>
                    <select id="topic" name="topic" value={formData.topic} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300">
                      <option value="">Select a topic</option>
                      {topics.map(topic => <option key={topic} value={topic}>
                          {topic}
                        </option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <textarea id="message" name="message" required rows={6} maxLength={2000} value={formData.message} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 resize-none" placeholder="Tell me about your project or how I can help..." />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full btn-hero disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send className="mr-2 h-5 w-5" />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};
export default Contact;