import { Mail } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import renderMarkdownLite from "../../utils/renderMarkdownLite";

const content = `# Contact Us

## Get in Touch With VarityWire

Have a question, spotted something that needs correcting, want to contribute an article, or interested in working with VarityWire?

We would like to hear from you.

VarityWire is built around information, ideas and conversations, and feedback from readers and contributors helps us improve.

## Editorial Enquiries

For questions about an article, editorial coverage, sources, interviews or story ideas, please contact our editorial team.

**Subject:** Editorial Enquiry – [Topic]

Please provide enough information for us to understand your enquiry and, where relevant, include the article URL.

## Report a Correction

If you believe an article contains a factual error, we encourage you to let us know.

Please include:

* Article title
* Article URL
* Specific information you believe is incorrect
* Correct information
* Supporting source or evidence

For more information about how we handle corrections, please see our **Corrections Policy**.

## Write for VarityWire

Interested in contributing an article?

We welcome original contributions from writers, professionals, researchers, educators, entrepreneurs and subject-matter experts.

Before submitting, please review our **Write for Us** guidelines to understand the subjects and editorial standards we follow.

## Research and Expert Contributions

Researchers, academics, professionals and subject-matter experts who have original research, findings, commentary or useful insights are welcome to contact us.

Please briefly explain your area of expertise and the subject you would like to discuss.

## Interviews and Story Ideas

Have a story, person, organisation, development or idea that you believe deserves attention?

Send us a short description of the story and explain why it may be useful or interesting to our readers.

We review story ideas based on relevance, originality, public interest and editorial value.

## Business and Partnership Enquiries

For advertising, partnerships, brand collaborations, sponsorship opportunities or other business enquiries, please clearly identify the nature of your proposal.

**Subject:** Business Enquiry – [Company/Organisation]

Commercial enquiries are reviewed separately from ordinary editorial submissions.

## General Enquiries

For anything that does not fit into the categories above, you can contact us with a brief description of your question.

We may not be able to respond to every message, but we review genuine enquiries as time and editorial priorities allow.

## A Note for Contributors

Please do not send copied articles, mass promotional emails or backlink-only proposals.

We are interested in original stories, useful research, informed perspectives and ideas that genuinely benefit VarityWire readers.

**VarityWire — Discover. Explore. Understand.**`;

const contactBox = [
  { label: "Editorial", email: "editorial@varitywire.com", desc: "Article questions, coverage, story ideas" },
  { label: "Contributions", email: "write@varitywire.com", desc: "Submit an article or guest post" },
  { label: "Corrections", email: "corrections@varitywire.com", desc: "Report a factual error" },
  { label: "Business", email: "business@varitywire.com", desc: "Advertising, partnerships, sponsorships" },
  { label: "General", email: "hello@varitywire.com", desc: "Anything else" },
];

export default function ContactUs() {
  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {/* Contact box — sits above the full content for quick access */}
        <div className="bg-white border border-borderClr rounded-xl p-5 mb-8">
          <h2 className="text-sm font-medium text-textDark mb-4">Reach the right team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contactBox.map((item) => (
              <a
                key={item.email}
                href={`mailto:${item.email}`}
                className="flex items-start gap-3 border border-borderClr rounded-lg p-3 hover:border-primary/40 transition-colors"
              >
                <div className="bg-primary/10 text-primary rounded-md p-1.5 mt-0.5">
                  <Mail size={14} />
                </div>
                <div>
                  <p className="text-xs font-medium text-textDark">{item.label}</p>
                  <p className="text-[11px] text-textMuted mb-1">{item.desc}</p>
                  <p className="text-[11px] text-primary">{item.email}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {renderMarkdownLite(content)}
      </div>

      <Footer />
    </div>
  );
}