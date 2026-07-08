import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Layout from "@/components/Layout";

const faqs = [
  {
    question: "What is REPA and what does it do?",
    answer:
      "REPA (Real Estate Property Analyzer) helps you evaluate investment properties quickly. Enter a property address and key financials — purchase price, rent, expenses — and REPA calculates cap rate, cash flow, ROI, DSCR, and an AI-driven risk score so you can make a data-backed decision in minutes.",
  },
  {
    question: "How does the AI risk score work?",
    answer:
      "The AI risk score (0–100) weighs factors like debt-service coverage ratio, cap rate relative to local market benchmarks, repair cost exposure, and cash-on-cash return. A score below 34 is Low Risk, 34–66 is Medium Risk, and above 66 is High Risk. The score is a guide, not a guarantee — always verify with your own due diligence.",
  },
  {
    question: "How many analyses can I run on the Free plan?",
    answer:
      "The Free plan allows 3 analyses per calendar month. Counts reset on the first of each month. Upgrade to Pro (20/month) or Enterprise (unlimited) if you need more.",
  },
  {
    question: "Can I export my analysis as a PDF?",
    answer:
      "PDF export is available on the Enterprise plan. Free and Pro users will see a locked export button — click it to go to the Subscription page and upgrade.",
  },
  {
    question: "How do I restore a draft I started earlier?",
    answer:
      "REPA auto-saves your form progress to your browser's local storage after each step. When you return to the Analysis form within 24 hours, a banner will offer to restore your draft. Click \"Restore\" to pick up where you left off, or \"Start fresh\" to clear it.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. All data is transmitted over TLS (256-bit SSL) and stored encrypted in Supabase. REPA never sells your data to third parties. See the Privacy Policy for full details.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "Go to the Subscription page and click \"Manage billing & invoices →\". This opens the Stripe Customer Portal where you can cancel, change plans, or download invoices. Cancellation takes effect at the end of your current billing period.",
  },
  {
    question: "What happens to my saved analyses if I downgrade?",
    answer:
      "Your existing analyses are never deleted when you downgrade. You'll still be able to view all previously saved results. You just won't be able to run new analyses beyond the limit of your new plan.",
  },
];

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-foreground text-foreground/90 transition-colors"
      >
        <span className="font-medium">{question}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</p>
      )}
    </div>
  );
};

const Help = () => (
  <Layout>
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-1">Help &amp; FAQ</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Common questions about using REPA. Can't find what you're looking for?{" "}
        <a href="mailto:support@repa.io" className="text-primary hover:underline">
          Email us
        </a>
        .
      </p>

      <div className="bg-card border border-border rounded-xl px-6">
        {faqs.map((faq) => (
          <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  </Layout>
);

export default Help;
