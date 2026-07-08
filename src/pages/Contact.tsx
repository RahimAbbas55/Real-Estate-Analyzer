import { useState } from "react";
import { Mail, Linkedin, MessageSquare } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailto = `mailto:support@repa.io?subject=Contact from ${encodeURIComponent(name)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
    window.location.href = mailto;
    toast.success("Opening your email client…");
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-1">Contact Us</h1>
        <p className="text-muted-foreground text-sm mb-8">
          We typically respond within one business day.
        </p>

        <div className="grid gap-8 sm:grid-cols-[1fr_auto]">
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe your question or issue…"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send message
            </Button>
          </form>

          {/* Sidebar contact info */}
          <div className="flex flex-col gap-4 sm:w-52">
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-sm">
              <p className="font-medium text-foreground">Other ways to reach us</p>

              <a
                href="mailto:support@repa.io"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0" />
                support@repa.io
              </a>

              <a
                href="https://linkedin.com/company/repa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="w-4 h-4 shrink-0" />
                LinkedIn
              </a>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 text-sm space-y-1">
              <p className="font-medium text-foreground">Support hours</p>
              <p className="text-muted-foreground">Mon – Fri</p>
              <p className="text-muted-foreground">9 am – 6 pm ET</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
