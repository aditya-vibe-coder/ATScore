import { Type } from "@google/genai";
import { geminiClient } from "./ai";

function isMockAIActive(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !key || key.trim() === '' || key.includes('MY_GEMINI_API_KEY') || key.includes('placeholder');
}

/**
 * 1. Interactive STAR-method Achievement Rewriter logic
 */
export async function premiumStarRewrite(
  bulletText: string,
  resumeText: string,
  jdText: string,
  track: string
) {
  if (isMockAIActive()) {
    console.log('Dummy key or key missing. Returning realistic premium STAR rewrite variations for track: ' + track);
    return {
      variations: [
        {
          category: "Tech Architecture & Scale",
          rewrittenFull: "Architected high-throughput message processing microservices with Go and Apache Kafka, improving data ingestion throughput by 45% and reducing processing bottleneck metrics to sub-50ms.",
          situationTask: "Faced with data ingestion bottlenecks and sluggish REST communication channels during peak loads.",
          action: "Designed parallel consumer groups and partitioned Kafka topics to spread the execution payload efficiently across clusters.",
          result: "Gained a 45% performance improvement in event throughput and dropped queue depth backlog completely.",
          explanation: "This version uses highly attractive distributed systems paradigms (Go, Kafka, partitions) and quantifies latency/throughput directly."
        },
        {
          category: "Business Impact & Revenue",
          rewrittenFull: "Optimized customer checkout modules with local caching strategies, boosting core conversions by 18% and reclaiming an estimated $120K in annual cart-abandonment run-rate.",
          situationTask: "High latency during payment handshakes caused substantial customer cart dropping.",
          action: "Introduced server-backed session state pre-fetching and client-side background caching systems on React.",
          result: "Secured an 18% hike in conversion flow completion and diminished dropped carts.",
          explanation: "Translates code optimizations directly into real dollars and business metrics, which triggers high immediate corporate focus."
        },
        {
          category: "Engineering Leadership & Execution",
          rewrittenFull: "Mentored 4 junior backend devs and led agile sprint migrations to move legacy monolith modules onto modern microservice containers, completing target delivery 3 weeks ahead of schedule.",
          situationTask: "Legacy code dependencies blocked feature releases and stalled developer velocity.",
          action: "Enforced strict API contract mapping and established progressive shadow routing to migrate services with zero downtime.",
          result: "Completed the transition ahead of plan and amplified the team's sprint shipping velocity by 30%.",
          explanation: "Clearly details technical mentorship, planning, mitigation of risk during migrations, and tangible shipping speed gains."
        }
      ]
    };
  }

  const prompt = `You are a premium military-grade resume bullet point coach and STAR model writer.
The candidate wants to turn a weak or average resume bullet point into 3 highly impactful, metrics-driven STAR (Situation, Task, Action, Result) variations.

Target Career Track: ${track}
Target Job Description Reference: ${jdText || "No JD provided."}
Candidate Context / Full Resume:
${resumeText.slice(0, 4000)}

Weak/Average Bullet Point to rewrite:
"${bulletText}"

Compose 3 premium STAR-method achievement variations. Ensure they use high-impact active verbs, quantify results with realistic, professional metrics (e.g., latency reduction, cost savings, user retention, scale), and eliminate all fluff/cliché words (e.g. "go-getter", "passionately", "team player"). One should focus on Technical Scale/Architecture, one on Business Impact/Revenue/Delivery, and one on general Engineering Leadership/Execution.

Respond with valid JSON following this exact structure:
{
  "variations": [
    {
      "category": "e.g., Tech Architecture & Scale",
      "rewrittenFull": "The completed strong bullet point containing the STAR rewrite",
      "situationTask": "The Situation & Task solved in this bullet",
      "action": "The specific Action taken with precise engineering verbs",
      "result": "The quantified, measurable Result attained",
      "explanation": "Why this version dramatically outperforms the original bullet"
    }
  ]
}`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Improve the bullet point: "${bulletText}"`,
      config: {
        systemInstruction: prompt,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["variations"],
          properties: {
            variations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["category", "rewrittenFull", "situationTask", "action", "result", "explanation"],
                properties: {
                  category: { type: Type.STRING },
                  rewrittenFull: { type: Type.STRING },
                  situationTask: { type: Type.STRING },
                  action: { type: Type.STRING },
                  result: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini server");
    }
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Premium STAR rewrite failed:", err);
    throw new Error(err.message || "Gemini rewrite collapsed.");
  }
}

/**
 * 2. Notice-Period & GCC Alignment checker logic
 */
export async function premiumGccAlignment(resumeText: string) {
  if (isMockAIActive()) {
    console.log('Dummy key or key missing. Returning realistic GCC alignment check.');
    return {
      noticePeriodFound: "90 Days standard contractual notice (Serving active)",
      locationEligibility: "Highly eligible for major Indian GCC centers: Bangalore, Pune, and Hyderabad.",
      appealScore: 85,
      detectedNoticeWeeks: 12,
      frictionPoints: [
        "The 90-day notice requirement causes instant automated filters to drop the application state during initial crawling batches.",
        "A heavy presence of service-delivery keywords (TCS, Accenture) overshadows product-resiliency benchmarks."
      ],
      cultureTransitionAdvice: "Structure your architecture descriptions to showcase individual system ownership rather than top-down assignment execution. Highlight service level agreements (SLAs) and deployment velocity metrics directly.",
      noticeTricks: [
        {
          originalPhrasing: "90 days standard notice period",
          suggestedPhrasing: "Active serving notice with locked Last Working Day: June 30th (Negotiable early release of 45 days backed by buyout option)",
          benefit: "Refactoring standard notice to list LWD and early release waiver eligibility completely bypasses automated ATS exclusion workflows."
        }
      ]
    };
  }

  const prompt = `You are a recruitment director at a prestige Global Capability Center (GCC) in India (such as Goldman Sachs, Target, Walmart, JPMorgan, Shell, HSBC, Wells Fargo, etc.).
Analyze this Indian candidate's resume specifically for eligibility, friction points, notice period commitments, location preferences, and ultimate GCC corporate placement appeal.

Examine the resume for:
- Current location & potential GCC hubs alignment (Bangalore, NCR/Gurgaon, Hyderabad, Pune, Chennai, Mumbai).
- Any explicit or implicit notice commitments (e.g., 90 days vs immediate joiner, out-of-notice period, serving last working day).
- Highlight key Indian GCC friction markers (e.g., career gaps, mass-hiring services company to product culture transition hurdle, tool-specific locking vs core CS fundamentals).

Respond with valid JSON following this exact structure:
{
  "noticePeriodFound": "string (e.g., 'Not explicitly mentioned. Standard 90 days assumed' or the detected value)",
  "locationEligibility": "string (e.g., 'Strong match for standard Bangalore/Pune hubs')",
  "appealScore": 0-100 (integer representing appeal to tier-1 GCC product teams),
  "detectedNoticeWeeks": 0-12 (integer approximation of notice weeks, e.g., 12 for 90 days, 0 if immediate),
  "frictionPoints": ["array of 2-3 specific friction points detected"],
  "cultureTransitionAdvice": "string (advice on transitioning to a structured product-led engineering team)",
  "noticeTricks": [
    {
      "originalPhrasing": "e.g., '90 days standard notice'",
      "suggestedPhrasing": "e.g., 'Serving 90-day notice, negotiable to 45 days / LWD: July 30'",
      "benefit": "e.g., 'Recruiters filter out raw 90-day applicants. Showing LWD boosts contact rates by 300%'"
    }
  ]
}`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze GCC appeal for resume: \n${resumeText.slice(0, 6000)}`,
      config: {
        systemInstruction: prompt,
        temperature: 0.25,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["noticePeriodFound", "locationEligibility", "appealScore", "detectedNoticeWeeks", "frictionPoints", "cultureTransitionAdvice", "noticeTricks"],
          properties: {
            noticePeriodFound: { type: Type.STRING },
            locationEligibility: { type: Type.STRING },
            appealScore: { type: Type.INTEGER },
            detectedNoticeWeeks: { type: Type.INTEGER },
            frictionPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            cultureTransitionAdvice: { type: Type.STRING },
            noticeTricks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["originalPhrasing", "suggestedPhrasing", "benefit"],
                properties: {
                  originalPhrasing: { type: Type.STRING },
                  suggestedPhrasing: { type: Type.STRING },
                  benefit: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from GCC analyzer");
    }
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Premium GCC analysis failed:", err);
    throw new Error(err.message || "Gemini GCC analysis failed.");
  }
}

/**
 * 3. Concept Gap Mock Interview Kit logic
 */
export async function premiumInterviewPrep(
  resumeText: string,
  jdText: string,
  track: string
) {
  if (isMockAIActive()) {
    console.log('Dummy key or key missing. Returning realistic Mock Interview Prep kit.');
    return {
      identifiedGaps: [
        "Distributed Cache Consistency (Redis/Memcached)",
        "API Gateway Routing & Rate-Limiting",
        "Database Transaction Isolation & Sharding"
      ],
      questions: [
        {
          id: "q1",
          concept: "Distributed Cache Write Strategies & Cache Penetration",
          question: "How would you design a caching tier for a high-traffic product catalog to prevent Cache Stampede and Cache Penetration errors during flash sales?",
          whyRecruiterAsks: "They want to verify if your knowledge of Redis is limited to basic key-value fetches, or if you can handle high-concurrency race conditions.",
          suggestedResponseOutline: "1. Explain Cache Stampede: Use mutex locking (e.g., Redlock) so only one worker updates the cache while others back off.\n2. Prevent Cache Penetration: Store dummy or empty values in Redis with short TTLs for non-existent IDs, or deploy a Bloom Filter layer.\n3. Detail write-through vs write-behind strategies to trade off immediate consistency for speed.",
          confidenceIndication: "High-risk gap"
        },
        {
          id: "q2",
          concept: "Eventual Consistency in Distributed Systems",
          question: "If your checkout service writes to PostgreSQL but your analytics service consumes from Kafka, how do you guarantee database writes and message dispatches occur atomically?",
          whyRecruiterAsks: "Primes your architectural depth on two-phase commits vs the Outbox Pattern.",
          suggestedResponseOutline: "1. Recommend the Transactional Outbox Pattern: Save both the order record and the event payload in the same SQL database under a single transaction.\n2. Run a polling publisher (e.g., Debezium CDC) that tails the outbox table and streams events into Kafka safely.\n3. Avoid distributed 2PC due to coordinator failure points and latency overheads.",
          confidenceIndication: "Medium-risk gap"
        }
      ]
    };
  }

  const prompt = `You are a Principal Engineering Lead conducting calibration loops at high-bar tech employers in India. 
Compare this candidate's resume content with their target Job Description and career track. Identify the exact technical or system-design "concept gaps" — technologies they lack, or areas they claim experience in but where recruiters will probe deeply.
Generate a Custom Mock Interview Prep Board with 5 highly custom, technical scenario questions probing these exact gaps.

Respond with valid JSON following this exact structure:
{
  "identifiedGaps": ["array of 2-3 key technical gaps or weak spots, e.g. 'Lack of gRPC/protobufs'"],
  "questions": [
    {
      "id": "q1",
      "concept": "The concept name, e.g. 'Distributed Locking & Race Conditions'",
      "question": "The tough interview question, tailored to probe their specific credentials gap",
      "whyRecruiterAsks": "The structural recruiter angle — what they are scanning for",
      "suggestedResponseOutline": "Markdown bullet-points explaining exactly how the candidate should answer, including architecture diagrams descriptions, specific APIs, or algorithmic trade-offs",
      "confidenceIndication": "High-risk gap | Medium-risk gap | Normal validation"
    }
  ]
}`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate prep kit. Resume: \n${resumeText.slice(0, 5000)}\n\nJD: \n${(jdText || "").slice(0, 3000)}`,
      config: {
        systemInstruction: prompt,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["identifiedGaps", "questions"],
          properties: {
            identifiedGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "concept", "question", "whyRecruiterAsks", "suggestedResponseOutline", "confidenceIndication"],
                properties: {
                  id: { type: Type.STRING },
                  concept: { type: Type.STRING },
                  question: { type: Type.STRING },
                  whyRecruiterAsks: { type: Type.STRING },
                  suggestedResponseOutline: { type: Type.STRING },
                  confidenceIndication: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from interview coach");
    }
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Premium Interview Prep failed:", err);
    throw new Error(err.message || "Gemini interview prep session failed.");
  }
}

/**
 * 4. Real-time "Keyword Injector" helper logic
 */
export async function premiumKeywordInjector(resumeText: string, keywords: string[]) {
  if (isMockAIActive()) {
    console.log('Dummy key or key missing. Returning realistic keyword placements.');
    return {
      injections: [
        {
          keyword: "Kubernetes",
          logicalLocation: "Under Software Engineering Experience at current role",
          originalContextText: "Deployed applications to cloud instances and set up scaling rules.",
          suggestedInjectedText: "Orchestrated scalable microservice container deployments using Kubernetes/Docker on GCP, managing horizontal pod autoscaling rules across high-traffic API nodes.",
          justification: "This increases structural density for containerization keywords and proves direct operational familiarity with infrastructure orchestration."
        },
        {
          keyword: "Redis Caching",
          logicalLocation: "Under Project Details for Inventory Manager",
          originalContextText: "Created web API for product inventory lookups.",
          suggestedInjectedText: "Engineered low-latency inventory retrieval APIs using Node.js, implementing a Redis Caching layer that reduced query execution times from 450ms down to 12ms.",
          justification: "Providing concrete latency drop numbers backed by Redis highlights clear systems engineering prowess."
        }
      ]
    };
  }

  const prompt = `You are an ATS compliance engineer.
You are given a candidate's resume and a list of target industry keywords that are currently missing or weak.
Find contextually natural placements ("injection points") in their actual resume text where these keywords could be effortlessly integrated. Provide a complete suggested flowing sentence so it reads elegantly without looking like keyword stuffing.

Missing Keywords Target: ${keywords.join(", ")}

Respond with valid JSON following this exact structure:
{
  "injections": [
    {
      "keyword": "The name of the keyword, e.g. 'Kubernetes'",
      "logicalLocation": "The logical segment, e.g., 'Under Software Engineer role at Flipkart'",
      "originalContextText": "E.g., 'Led cloud migration of the inventory microservices.'",
      "suggestedInjectedText": "E.g., 'Led cloud migration of inventory microservices, deploying resilient container clusters using Kubernetes and Docker.'",
      "justification": "Why this injection sounds fully natural and provides maximum ATS parser density"
    }
  ]
}`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Provide keyword placements. Resume: \n${resumeText.slice(0, 6000)}`,
      config: {
        systemInstruction: prompt,
        temperature: 0.25,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["injections"],
          properties: {
            injections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["keyword", "logicalLocation", "originalContextText", "suggestedInjectedText", "justification"],
                properties: {
                  keyword: { type: Type.STRING },
                  logicalLocation: { type: Type.STRING },
                  originalContextText: { type: Type.STRING },
                  suggestedInjectedText: { type: Type.STRING },
                  justification: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from injector service");
    }
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Premium Keyword Injector failed:", err);
    throw new Error(err.message || "Keyword injection analysis collapsed.");
  }
}

/**
 * 5. Automated Indian University Tier & Compensation Benchmark Analyser logic
 */
export async function premiumTierCompAnalyzer(resumeText: string) {
  if (isMockAIActive()) {
    console.log('Dummy key or key missing. Returning realistic Tier & Compensation predictions.');
    return {
      detectedTierRating: "Tier-1 (BITS Pilani Benchmark)",
      detectedTierBadge: "Gold Class Tier 1",
      yearsOfExperience: "4.5 Years",
      identifiedCoreHotSkills: [
        "React / TypeScript",
        "Go/Node.js Microservices",
        "GCP / Kubernetes",
        "Redis / Apache Kafka Cascades"
      ],
      predictions: [
        {
          city: "Bangalore / Bengaluru (GCC & Startup standard)",
          minLpa: 16,
          maxLpa: 24,
          notes: "Premium compensation ranges aligned with tier-1 engineering hubs, offering competitive stock options/RSUs."
        },
        {
          city: "Delhi NCR (Gurgaon/Noida)",
          minLpa: 14,
          maxLpa: 22,
          notes: "Excellent base packages with slightly higher fixed variables."
        },
        {
          city: "Hyderabad / Pune",
          minLpa: 13,
          maxLpa: 19,
          notes: "Steady growth with favorable living expense conversion ratios."
        }
      ],
      recommendationsToNegotiate: [
        "Leverage your proven scale metrics (e.g. 10M+ daily API hits) to request a higher fixed component since many GCCs cap variable components.",
        "Bypass HR limits on maximum hike percentages by presenting competing vendor offers or showing immediate, ready-to-join availability."
      ]
    };
  }

  const prompt = `You are an Indian Executive Compensation Benchmarker and Technical Talent partner.
Analyze this Indian candidate's resume to identify their educational tier (Tier 1 like IIT, NIT, BITS, IIIT, Tier 2, or Tier 3), total years of experience, hot high-demand tech skills, and estimate their actual market compensation range in Indian Rupees (INR Lakhs Per Annum - LPA).

Provide localized CTC prediction ranges for Bangalore, Mumbai, and Delhi/NCR regions, as well as an Indian University tier rating verdict.

Respond with valid JSON following this exact structure:
{
  "detectedTierRating": "Tier-1 (IIT/NIT/BITS) | Tier-2 (Good regional/state tech colleges) | Tier-3 (Standard affiliated academic colleges)",
  "detectedTierBadge": "Gold Class Tier 1 | Silver Class Tier 2 | Standard Tier 3",
  "yearsOfExperience": "e.g., 4.5 Years",
  "identifiedCoreHotSkills": ["array of 3-4 hot technical skills found that boost salary potential"],
  "predictions": [
    {
      "city": "Bangalore / Bengaluru",
      "minLpa": 12,
      "maxLpa": 18,
      "notes": "Premium pay for startup hubs, product engineering team standards"
    },
    {
      "city": "Delhi NCR (Gurgaon/Noida)",
      "minLpa": 10,
      "maxLpa": 16,
      "notes": "Excellent compensation in consulting, SaaS product suites"
    },
    {
      "city": "Hyderabad / Pune",
      "minLpa": 9,
      "maxLpa": 15,
      "notes": "Consistent, steady salaries with lower cost of living"
    }
  ],
  "recommendationsToNegotiate": ["array of 2-3 salary negotiation suggestions for this level"]
}`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze compensation for candidate: \n${resumeText.slice(0, 6000)}`,
      config: {
        systemInstruction: prompt,
        temperature: 0.25,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["detectedTierRating", "detectedTierBadge", "yearsOfExperience", "identifiedCoreHotSkills", "predictions", "recommendationsToNegotiate"],
          properties: {
            detectedTierRating: { type: Type.STRING },
            detectedTierBadge: { type: Type.STRING },
            yearsOfExperience: { type: Type.STRING },
            identifiedCoreHotSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["city", "minLpa", "maxLpa", "notes"],
                properties: {
                  city: { type: Type.STRING },
                  minLpa: { type: Type.INTEGER },
                  maxLpa: { type: Type.INTEGER },
                  notes: { type: Type.STRING }
                }
              }
            },
            recommendationsToNegotiate: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from compensation benchmarker");
    }
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Premium Comp Analyzer failed:", err);
    throw new Error(err.message || "Compensation benchmarking failed.");
  }
}

/**
 * 6. Premium LinkedIn Referral Pitch & Cold Email Generator
 */
export async function premiumReferralPitch(
  resumeText: string,
  targetCompany: string,
  targetJobTitle: string
) {
  if (isMockAIActive()) {
    console.log('Dummy key or key missing. Returning realistic referral pitches.');
    return {
      linkedinPitch: `Hi [Name], loved your insights on scale at ${targetCompany}. I'm a senior Full-Stack Dev with a tier-1 background. I saw your team is hiring a ${targetJobTitle}. With my background in high-throughput node microservices (+40% speedups), I’d love to commit there. Would you be open to review my CV for a quick referral?`,
      coldEmailSubject: `Referral Proposal: ${targetJobTitle} [IIT/Tier-1 + 4 YOE] - [Your Name]`,
      coldEmailBody: `Dear [Name],\n\nI hope this message finds you well.\n\nI've been following the engineering initiatives at ${targetCompany}, particularly regarding your high-traffic scaling vectors. I noticed the open ${targetJobTitle} position and believe my technical background aligns exceptionally well.\n\nOver the past 4.5 years, I've specialized in architectural optimization, recently driving a 45% latency reduction across internal APIs and leading a distributed cluster migration on GCP. My background from a Tier-1 academic institution has reinforced strong computer science foundations that allow me to contribute from day one.\n\nI have attached my standard one-page resume. If you are open to it, I would appreciate a brief chat to explore if a referral is viable.\n\nThank you for your time and partnership.\n\nWarm regards,\n\n[Your Name]\n[Link to Portfolio / GitHub]`,
      referralProtocolStrategy: "1. Do not ask for a referral on message one. Engage with their recent LinkedIn architecture post first.\n2. Highlight shared academic or corporate alumni connections to instantly trigger familiarity bias."
    };
  }

  const prompt = `You are an executive talent coach specializing in Indian tech ecosystem referrals (FAANG, GCCs, high-growth startups like Swiggy, Razorpay, Zomato, Flipkart).
Generate a micro-tailored, ultra-convincing LinkedIn message (under 300 characters / limit wordy fluff) AND a formal Cold Email pitch that candidates can send to senior engineers or managers to ask for a secure job referral.
The core argument must link their resume achievements with the target position: "${targetJobTitle}" at "${targetCompany}".

Respond with valid JSON following this exact structure:
{
  "linkedinPitch": "The short 300-char LinkedIn request. Highly polite, value-first, zero-friction.",
  "coldEmailSubject": "String subject line",
  "coldEmailBody": "Full email message with brackets like [Name] ready for replacement",
  "referralProtocolStrategy": "2-3 precise bullet coaching tips on how to build rapport first in India"
}`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate pitching tools. Target: ${targetJobTitle} at ${targetCompany}. Resume: \n${resumeText.slice(0, 5000)}`,
      config: {
        systemInstruction: prompt,
        temperature: 0.35,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["linkedinPitch", "coldEmailSubject", "coldEmailBody", "referralProtocolStrategy"],
          properties: {
            linkedinPitch: { type: Type.STRING },
            coldEmailSubject: { type: Type.STRING },
            coldEmailBody: { type: Type.STRING },
            referralProtocolStrategy: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from pitching engine");
    }
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Premium Pitch Analyzer failed:", err);
    throw new Error(err.message || "Pitch generator failed.");
  }
}

/**
 * 7. Naukri Profile SEO Headline & Bio Optimizer
 */
export async function premiumNaukriSocialOptimize(resumeText: string) {
  if (isMockAIActive()) {
    console.log('Dummy key or key missing. Returning realistic Naukri Profile SEO headlines.');
    return {
      headlines: [
        "Senior Full Stack Engineer | React, Node.js, Kubernetes | BITS Pilani (Tier-1) | serving notice 45 days release",
        "Backend Microservices Lead | Go, Kafka, GCP Architecture | 4+ YOE | Immediate Joiner",
        "Lead UI Architect | TypeScript, React.js, Next.js, Web-Perf Optimization | Tier-1 Pedigree",
        "Senior Software Engineer | High-Throughput APIs, System Design, SQL | Serving Notice"
      ],
      recruiterPitchSummary: "Senior Full-Stack Software Developer representing a BITS Pilani Tier-1 academic background and over 4 years of hands-on scale contribution. Expert in architecting resilient Go/Node.js API systems, Kubernetes orchestration, and reactive responsive React layouts. Adept at driving STAR achievements, optimizing cloud deployments, and serving notice for immediate start.",
      strategicKeywordsList: [
        "Backend Architect",
        "Microservices",
        "System Design",
        "Kubernetes",
        "Kafka",
        "Node.js",
        "React.js",
        "TypeScript",
        "GCP",
        "Redis"
      ],
      naukriHacks: "The Naukri search index rank is heavily keyed on profile fresh update timestamps. Simply updating a single comma, symbol, or skill tag in your profile skills array daily before 10 AM (IST) bumps your profile timestamp, pushing your profile to the top 10% of recruiter search boards when their morning sourcing starts."
    };
  }

  const prompt = `You are a professional Naukri and LinkedIn India visual consultant. 
Optimize this candidate's profile metadata for maximum visibility on Naukri search crawlers and recruiter index queries.
Generate four hook-filled titles, an SEO summary description containing rich key terms, and suggested skill tags that boost profile discovery index by up to 400%.

Respond with valid JSON following this exact structure:
{
  "headlines": ["Array of 4 different high-CTR Naukri Headline propositions, optimized with years of exp, tier background, or hot tech tags"],
  "recruiterPitchSummary": "A beautifully drafted 4-sentence profile summary optimized for Indian HR screening habits.",
  "strategicKeywordsList": ["8-10 keyword tags to copy and paste to bypass automated filters"],
  "naukriHacks": "One paragraph of raw insider advice on how often to update Naukri CV to trigger continuous crawl bumps"
}`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Optimize Naukri presence for resume: \n${resumeText.slice(0, 5000)}`,
      config: {
        systemInstruction: prompt,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["headlines", "recruiterPitchSummary", "strategicKeywordsList", "naukriHacks"],
          properties: {
            headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
            recruiterPitchSummary: { type: Type.STRING },
            strategicKeywordsList: { type: Type.ARRAY, items: { type: Type.STRING } },
            naukriHacks: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from social optimizer");
    }
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Premium Social Optimizer failed:", err);
    throw new Error(err.message || "Social optimizer failed.");
  }
}

/**
 * 8. Interactive JD Match Sandbox Analyser
 */
/**
 * 9. Cover Letter Generator
 */
export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  track: string,
  userName: string
) {
  const trackName = track;

  if (isMockAIActive()) {
    const mockLetter = `I am writing to express my strong interest in the ${trackName} role. With my proven track record in delivering scalable solutions and driving measurable impact, I am confident in my ability to contribute effectively to your team.

Throughout my career, I have consistently delivered results by leveraging my technical expertise and problem-solving skills. My experience includes leading cross-functional initiatives, optimizing system performance, and mentoring junior team members.

I would welcome the opportunity to discuss how my background and skills align with your team's goals. Thank you for your time and consideration.`;
    const wc = mockLetter.split(/\s+/).length;
    return { cover_letter: mockLetter, word_count: wc };
  }

  const prompt = `You are a professional resume writer who specializes in the Indian job market.

Candidate Resume:
---
${resumeText}
---

Target Job Description:
---
${jobDescription}
---

Track: ${trackName}

Task: Write a professional cover letter for this candidate targeting the above job.
Follow these ABSOLUTE rules:

STRUCTURE (3 paragraphs only, no headers):
Paragraph 1 — Opening (2-3 sentences):
  State specific interest in the role and company from the JD.
  Lead with the candidate's most relevant credential or achievement.
  FAANG India track: open with a metric from their resume.
  Mass Hiring track: reference CGPA if ≥6.5 or relevant percentage.
  Indian Startups track: reference a shipped project or GitHub work.
  Naukri.com track: reference current role and years of experience.
  Consulting MNC track: reference a certification or client-facing result.

Paragraph 2 — Value Proof (4-5 sentences):
  Connect 2-3 specific achievements from the resume to the JD requirements.
  Mirror the exact skill keywords from the JD wherever genuinely applicable.
  Use active verbs and include metrics where the resume provides them.
  Do NOT invent achievements. Use only what is in the resume.

Paragraph 3 — Close (2-3 sentences):
  For Naukri.com track: state current notice period and that you are
    available to discuss expected CTC.
  For all other tracks: request a call or interview. Be direct.
  End with a single-line professional sign-off.

TRACK-SPECIFIC TONE:
  Mass Hiring (TCS/Infosys/Wipro/HCL): Formal, disciplined tone.
    Avoid casual language. Emphasize reliability and team fit.
    Max 220 words total.
  Naukri.com Index: Professional, direct. Mention notice period.
    Max 200 words total.
  FAANG India: Impact-first. Use numbers. Mention scale where possible.
    Max 280 words total.
  Indian Startups: Energetic, initiative-driven. Mention shipped work.
    Max 240 words total.
  LinkedIn/Consulting MNC: Stakeholder language. Professional services
    tone. Reference governance or process where applicable.
    Max 260 words total.

Output ONLY the cover letter body. No subject line. No "Dear Hiring Manager"
header. Start directly with the first paragraph. No preamble, no metadata,
no explanation.

Candidate name for sign-off: ${userName}
`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Write a cover letter for ${userName} targeting the ${trackName} track.`,
      config: {
        systemInstruction: prompt,
        temperature: 0.3,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    const coverLetter = text.trim();
    const wordCount = coverLetter.split(/\s+/).length;
    return { cover_letter: coverLetter, word_count: wordCount };
  } catch (err: any) {
    console.error("Cover letter generation failed:", err);
    throw new Error(err.message || "Cover letter generation failed.");
  }
}

/**
 * 10. Offer Letter Analyzer
 */
export async function analyzeOfferLetter(
  offerText: string,
  role: string,
  company: string,
  location: string,
  experienceYears: number
) {
  if (isMockAIActive()) {
    return {
      gross_annual_ctc: 1800000,
      basic_salary_annual: 720000,
      hra_annual: 360000,
      variable_pay_annual: 360000,
      special_allowance_annual: 240000,
      pf_employer_annual: 86400,
      gratuity_annual: 34632,
      equity_annual: 0,
      other_benefits_annual: 0,
      in_hand_monthly_estimate: 104000,
      variable_percentage: 20,
      red_flags: ["No HRA mentioned", "Variable pay > 35% of CTC"],
      positive_points: ["Above market base salary", "Standard PF contribution"],
      market_comparison: 'at_market' as const,
      negotiation_room: 'medium' as const,
      negotiation_email: "Subject: Re: Offer Letter – " + role + " Position\n\nDear Team,\n\nThank you for the offer. I am very excited about this opportunity at " + company + ". Based on my market research and experience, I would like to discuss the compensation structure.",
      negotiation_verbal_script: "Thank you for the offer, I'm really excited about this opportunity at " + company + ". Based on my experience of " + experienceYears + " years and market research for this role in " + location + ", I was hoping we could discuss the compensation further.",
      recommended_ask_ctc: 2100000,
    };
  }

  const prompt = `You are a compensation specialist for the Indian tech job market with
deep expertise in CTC structures, Indian labor law, and salary benchmarking.

Offer Letter Content:
---
${offerText}
---

Context:
Role: ${role}
Company: ${company}
Location: ${location}
Years of Experience: ${experienceYears}

TASK 1 — CTC BREAKDOWN:
Parse the offer letter and extract EVERY compensation component.
If a component is not mentioned in the letter, set it to 0.
Calculate gross_annual_ctc as the sum of all components.

TASK 2 — IN-HAND ESTIMATE:
Calculate estimated monthly in-hand considering standard deductions.

TASK 3 — RED FLAG DETECTION:
Check for: bond period, joining bonus clawback, variable pay > 35%, notice period > 3 months, no HRA, equity vesting not specified, probation > 6 months.

TASK 4 — MARKET COMPARISON:
Compare to typical market range for this role, location, and experience.

TASK 5 — NEGOTIATION EMAIL:
Write a complete, ready-to-send negotiation email.

TASK 6 — VERBAL SCRIPT:
Write a 5-6 sentence verbal script for a phone call with HR.

Return a single JSON object with ALL fields. No preamble, no markdown.
Field names exactly: gross_annual_ctc, basic_salary_annual, hra_annual,
variable_pay_annual, special_allowance_annual, pf_employer_annual,
gratuity_annual, equity_annual, other_benefits_annual,
in_hand_monthly_estimate, variable_percentage, red_flags (array of strings),
positive_points (array of strings), market_comparison (one of: 'below_market'|'at_market'|'above_market'),
negotiation_room (one of: 'low'|'medium'|'high'),
negotiation_email (full email including subject), negotiation_verbal_script,
recommended_ask_ctc.`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze this offer letter for ${role} at ${company}: ${offerText.slice(0, 5000)}`,
      config: {
        systemInstruction: prompt,
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err: any) {
    console.error("Offer analysis failed:", err);
    throw new Error(err.message || "Offer analysis failed.");
  }
}

/**
 * 11. Resume JD Tailor
 */
export async function tailorResumeToJD(
  resumeText: string,
  jobDescription: string,
  track: string,
  originalScore: number
) {
  if (isMockAIActive()) {
    return {
      professional_summary: "Experienced software engineer with expertise in building scalable web applications using React, Node.js, and TypeScript. Proven track record of delivering high-quality solutions.",
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Redis", "Docker", "Kubernetes", "GCP", "API Design", "System Design", "Microservices", "CI/CD", "Git", "Agile", "Python"],
      experience_bullets: { "Flipkart - Senior Engineer": ["Architected scalable microservices handling 10M+ daily requests", "Reduced deployment time by 60% through Kubernetes migration"] },
      added_keywords: ["Kubernetes", "Microservices", "System Design", "CI/CD"],
      estimated_score_improvement: 15,
    };
  }

  const prompt = `You are a senior ATS resume optimizer specializing in the Indian job market.

ORIGINAL RESUME:
---
${resumeText}
---

TARGET JOB DESCRIPTION:
---
${jobDescription}
---

Track: ${track}
Original ATS Score: ${originalScore}/100

ABSOLUTE RULES:
1. Do NOT invent experience, companies, projects, or certifications not in the original resume.
2. You MAY reframe, reorder, and rephrase real achievements to better match JD language.
3. Keep ALL company names, job titles, dates, and institutions exact.

TASK 1 — PROFESSIONAL SUMMARY (max 4 sentences)
TASK 2 — SKILLS SECTION (15-20 skills, JD-relevant first)
TASK 3 — EXPERIENCE BULLETS (max 4 per role)

Return JSON exactly:
{
  "professional_summary": string,
  "skills": [string],
  "experience_bullets": { "Company Name - Role Title": [string] },
  "added_keywords": [string],
  "estimated_score_improvement": number
}`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Tailor this resume to the JD: ${resumeText.slice(0, 5000)}`,
      config: {
        systemInstruction: prompt,
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Resume tailoring failed:", err);
    throw new Error(err.message || "Resume tailoring failed.");
  }
}

/**
 * 12. LinkedIn Profile Generator
 */
export async function generateLinkedInProfile(
  resumeText: string,
  track: string,
  currentHeadline: string,
  currentAbout: string,
  userName: string
) {
  if (isMockAIActive()) {
    return {
      headlines: [
        "Senior Full Stack Engineer | React, Node.js, TypeScript | Building Scalable Products",
        "Software Engineer | Distributed Systems & Microservices | 4+ Years Experience",
        "Full Stack Developer | Cloud-Native Apps | System Design Enthusiast"
      ],
      about_section: `I am a software engineer with 4+ years of experience building scalable web applications and distributed systems. My expertise spans React, TypeScript, Node.js, and cloud-native technologies.`,
      skills_to_add: ["React", "TypeScript", "Node.js", "System Design", "Microservices", "Kubernetes", "Docker", "PostgreSQL", "Redis", "GCP", "CI/CD", "Agile", "REST APIs", "GraphQL", "Python"],
      completeness_checklist: [
        { item: "Add a professional photo (profiles with photos get 21x more views)", impact: "high" as const, done: false },
        { item: "Set #OpenToWork for 40% more recruiter InMails", impact: "high" as const, done: false },
        { item: "Add 5+ skills for endorsements", impact: "high" as const, done: false },
      ]
    };
  }

  const prompt = `You are a LinkedIn profile expert for the Indian job market with deep
knowledge of how Indian recruiters search.

Candidate Resume:
---
${resumeText}
---

Target Track: ${track}
Candidate Name: ${userName}
Current Headline: ${currentHeadline || 'Not provided'}
Current About: ${currentAbout || 'Not provided'}

Generate:
1. 3 headline options (max 120 chars each)
2. About section (max 2000 chars, first person)
3. 15 skills to add (ranked by recruiter search frequency)
4. 10-item completeness checklist

Return JSON:
{
  "headlines": [string, string, string],
  "about_section": string,
  "skills_to_add": [string],
  "completeness_checklist": [{"item": string, "impact": "high"|"medium", "done": boolean}]
}`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate LinkedIn profile content for ${userName} in the ${track} track.`,
      config: {
        systemInstruction: prompt,
        temperature: 0.3,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (err: any) {
    console.error("LinkedIn profile generation failed:", err);
    throw new Error(err.message || "LinkedIn profile generation failed.");
  }
}

export async function premiumJdMatchSandbox(resumeText: string, jdText: string) {
  if (isMockAIActive()) {
    console.log('Dummy key or key missing. Returning realistic comparative match review.');
    return {
      matchScore: 76,
      summary: "This candidate is a highly viable backend and frontend fit with robust TypeScript and Express skills, but exhibits moderate gaps in production infrastructure orchestration and queuing systems (Kafka/RabbitMQ) listed in the Job Description. Easily adjustable by adopting the STAR bullet proposals below.",
      matchedSkills: [
        {
          skill: "TypeScript / Node.js Backend",
          level: "Strong",
          sentenceContext: "Developed scalable server controllers and database schemas utilizing typed interfaces."
        },
        {
          skill: "React Web Portals",
          level: "Strong",
          sentenceContext: "Designed responsive dashboard interfaces with standard component workflows."
        }
      ],
      missingSkills: [
        {
          skill: "GCP Cloud Infrastructure Orchestration",
          impact: "High Priority",
          recommendation: "Integrate mentions of Google Cloud Run, Cloud Spanner or VPC networking settings inside your recent project descriptions."
        },
        {
          skill: "Message Queues (Apache Kafka)",
          impact: "Medium Priority",
          recommendation: "Mention how you decoupled background transaction tasks by streaming event brokers."
        }
      ],
      softSkillsAnalysis: [
        {
          skill: "Cross-functional Collaboration",
          matched: true,
          insight: "Your resume details working closely with project managers and design teams to ship web portals which matches their stakeholder alignment expectation."
        },
        {
          skill: "System Resilience Ownership",
          matched: false,
          insight: "The JD expects candidates who own reliability, but your resume lacks direct mentions of troubleshooting, telemetry logging, or SLA tracking."
        }
      ],
      structuralFixes: [
        {
          originalText: "Responsible for setting up server routes and debugging bugs.",
          suggestedPhrase: "Architected Go/Node.js REST endpoints on Google Cloud Platform, using event-driven Kafka queuing to process 1.5M daily transactions with sub-40ms delivery SLAs.",
          benefit: "Instantly targets the JD's exact infrastructure expectations and demonstrates high-impact cloud scale capability."
        }
      ]
    };
  }

  const prompt = `You are a high-bar Technical Recruiter and ATS Compliance Architect.
Analyze this candidate's resume against their pasted Target Job Description (JD).
Analyze exact skill alignments, identify critical soft/hard keyword deficits, evaluate core behavioral competencies, and compile concrete bullet reforms to score 95%+ on high-end parsing software.

Respond with valid JSON following this exact structure:
{
  "matchScore": 75,
  "summary": "Full summary highlighting general state of match, target role suitability, and high-level advice.",
  "matchedSkills": [
    {
      "skill": "React.js",
      "level": "Strong",
      "sentenceContext": "Exact or closest matching phrase or project from their current resume text"
    }
  ],
  "missingSkills": [
    {
      "skill": "e.g., Redux Toolkit / Kafka",
      "impact": "Critical target requirement",
      "recommendation": "Provide actionable instruction on how or where the candidate can inject this skill tag organically based on their backend database logs or system scale milestones."
    }
  ],
  "softSkillsAnalysis": [
    {
      "skill": "e.g., Stakeholder management / System Resilience",
      "matched": true,
      "insight": "Short feedback on why this skill is present or how it matches what the JD expects."
    }
  ],
  "structuralFixes": [
    {
      "originalText": "Provide a weak/average line from their current resume that relates to this JD's core expectation",
      "suggestedPhrase": "Provide a powerful, high-impact rewritten STAR phrase incorporating exact keywords and realistic metrics",
      "benefit": "Detailed rationale on why this rewritten phrase grabs the hiring manager's attention immediately."
    }
  ]
}`;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Pasted Target JD:\n${jdText.slice(0, 4000)}\n\nCandidate Resume Context:\n${resumeText.slice(0, 5000)}`,
      config: {
        systemInstruction: prompt,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["matchScore", "summary", "matchedSkills", "missingSkills", "softSkillsAnalysis", "structuralFixes"],
          properties: {
            matchScore: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            matchedSkills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["skill", "level", "sentenceContext"],
                properties: {
                  skill: { type: Type.STRING },
                  level: { type: Type.STRING },
                  sentenceContext: { type: Type.STRING }
                }
              }
            },
            missingSkills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["skill", "impact", "recommendation"],
                properties: {
                  skill: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  recommendation: { type: Type.STRING }
                }
              }
            },
            softSkillsAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["skill", "matched", "insight"],
                properties: {
                  skill: { type: Type.STRING },
                  matched: { type: Type.BOOLEAN },
                  insight: { type: Type.STRING }
                }
              }
            },
            structuralFixes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["originalText", "suggestedPhrase", "benefit"],
                properties: {
                  originalText: { type: Type.STRING },
                  suggestedPhrase: { type: Type.STRING },
                  benefit: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Sandbox Matcher client");
    }
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Premium JD Match Sandbox failed:", err);
    throw new Error(err.message || "Interactive JD Match sandbox failed.");
  }
}
