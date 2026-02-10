/**
 * AI Fallback Service
 * 
 * Provides fallback responses when AI providers are unavailable.
 * Separated from AIService for better maintainability.
 */

import { createLogger } from '@/lib/logger';
import { ChatMessage } from '@/domain/interfaces/services/IAIService';

const logger = createLogger({ context: 'AIFallbackService' });

// Crisis resources message
const CRISIS_RESOURCES = `I notice you may be going through a difficult time. Your safety is important.

**Immediate Help:**
- **Crisis Text Line**: Text HOME to 741741
- **988 Suicide & Crisis Lifeline**: Call or text 988
- **Emergency**: Call 911 if you or someone else is in immediate danger

**Autism-Specific Support:**
- **Autism Response Tennessee**: 615-385-2077
- **National Autism Association**: 877-622-2884

You're not alone. These trained professionals are here to help 24/7.`;

// Topic-specific fallback responses
const FALLBACK_RESPONSES: Record<string, string> = {
  greeting: `Hello! I'm NeuroAI, your supportive companion. I'm here to help with questions about autism, daily challenges, or just to chat. How can I support you today?`,

  default: `I appreciate you reaching out. While I'm having trouble connecting to my full capabilities right now, I want you to know that your questions and concerns matter.

For immediate support:
- **Autism Speaks**: Visit autismspeaks.org for resources
- **Your local autism society** can provide community connections
- **Your healthcare provider** knows your specific situation best

Please try again in a few moments, and I'll do my best to help.`,

  sleep: `Sleep challenges are common in autism. Here are some strategies that many families find helpful:

**Environment:**
- Consistent bedtime routine
- Dark, quiet room (consider white noise)
- Comfortable temperature
- Weighted blanket (if appropriate)

**Schedule:**
- Same bedtime and wake time daily
- Limit screens 1 hour before bed
- Calming activities: bath, reading, gentle music

**Consider:**
- Melatonin (discuss with your doctor)
- Tracking sleep patterns to identify triggers

Every child is different—what works for one family may not work for another.`,

  behavior: `Behavior is communication. When challenging behaviors occur, consider:

**The ABCs:**
- **A**ntecedent: What happened before?
- **B**ehavior: What specifically occurred?
- **C**onsequence: What happened after?

**Common Triggers:**
- Sensory overload (lights, sounds, textures)
- Changes in routine
- Communication difficulties
- Physical discomfort

**Strategies:**
- Visual schedules for predictability
- Sensory breaks
- Clear, simple instructions
- Choices to provide control
- Celebrate small wins

A Board Certified Behavior Analyst (BCBA) can provide personalized strategies.`,

  communication: `Communication development varies greatly. Here are evidence-based approaches:

**AAC (Augmentative & Alternative Communication):**
- Picture Exchange (PECS)
- Speech-generating devices
- Sign language
- Communication apps

**Strategies:**
- Model language (narrate activities)
- Wait time (count to 10)
- Follow their lead (interest-based)
- Celebrate all communication attempts

**Professional Support:**
- Speech-Language Pathologist (SLP) evaluation
- Occupational Therapist for sensory aspects

Remember: Behavior is communication too. Look beyond words.`,

  school: `Navigating school supports can feel overwhelming. Here's a starting point:

**Know Your Rights:**
- IEP (Individualized Education Program) - for educational needs
- 504 Plan - for accommodations
- IDEA guarantees Free Appropriate Public Education (FAPE)

**IEP Tips:**
- You are an equal team member
- Bring data (examples of work, behaviors)
- Goals should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Request meeting anytime

**Preparation:**
- Visit wiki.icdl.com for DIR/Floortime approaches
- Connect with your state's Parent Training and Information Center

**Documentation:**
- Keep records of all communications
- Track progress on goals
- Note what works at home`,

  diagnosis: `The diagnostic journey can be emotional. Here's what to know:

**Who Diagnoses:**
- Developmental Pediatrician
- Child Psychologist
- Child Psychiatrist
- Neurologist

**What to Expect:**
- Comprehensive developmental evaluation
- Parent/caregiver interviews
- Observation of your child
- Review of medical and developmental history

**After Diagnosis:**
- Early intervention services (birth-3)
- School-based services (3+)
- Therapies: Speech, OT, ABA (if chosen)
- Connect with other parents

**Remember:**
- A diagnosis opens doors to services
- Your child is the same wonderful person
- Trust your instincts as a parent
- It's okay to grieve and also hope`,

  therapy: `Common therapies for autism include:

**Speech-Language Therapy:**
- Communication skills
- Social pragmatics
- Alternative communication (AAC)

**Occupational Therapy:**
- Sensory processing
- Fine motor skills
- Daily living activities
- Self-regulation

**Physical Therapy:**
- Gross motor skills
- Coordination
- Strength

**Developmental Approaches:**
- DIR/Floortime - relationship-based
- SCERTS - social communication
- RDI - relationship development

**Behavioral Approaches:**
- ABA (Applied Behavior Analysis) - research your provider
- PRT (Pivotal Response Treatment)
- ESDM (Early Start Denver Model)

**Choose What Fits:**
Every family is different. What matters most is the relationship between therapist and child.`,

  meltdown: `Meltdowns are different from tantrums—they're a response to overwhelm, not a bid for attention.

**During a Meltdown:**
- Ensure safety (clear space, remove hazards)
- Stay calm (your calm helps them regulate)
- Reduce demands
- Don't try to reason or discipline
- Wait it out

**After the Meltdown:**
- Recovery time (they may be exhausted)
- No discussion about behavior yet
- Comfort if wanted (don't force)
- Note triggers for future prevention

**Prevention:**
- Identify triggers (sensory, transitions, hunger, fatigue)
- Visual schedules
- Warnings before transitions
- Sensory diet throughout day
- Communication supports

**Recovery is Part of the Process:**
Be gentle with yourself and your child.`,

  sensory: `Sensory processing differences are common in autism:

**Hypersensitive (Over-responsive):**
- Covers ears for sounds others don't notice
- Avoids certain textures/clothing
- Sensitive to bright lights
- Picky eating (texture related)

**Hyposensitive (Under-responsive):**
- Seeks movement (spinning, crashing)
- High pain tolerance
- Makes loud sounds
- Enjoys tight squeezes

**Sensory Diet Ideas:**
- Proprioceptive: jumping, pushing, carrying heavy things
- Vestibular: swinging, spinning (carefully)
- Tactile: playdough, water play, textures
- Oral: crunchy foods, straws, chewy tubes

**Environmental Modifications:**
- Noise-canceling headphones
- Sunglasses or dim lighting
- Comfortable clothing (tagless)
- Fidgets

An Occupational Therapist can create a personalized sensory plan.`,

  eating: `Eating challenges are common. Here are some approaches:

**Rule Out Medical:**
- GI issues are more common in autism
- Food allergies/intolerances
- Dental problems
- Swallowing difficulties

**Practical Strategies:**
- Same food as family (no separate meals)
- Small portions (less overwhelming)
- Food chaining (small steps from preferred foods)
- No pressure (keep mealtimes calm)
- Model eating

**Sensory Considerations:**
- Some textures are truly intolerable
- Temperature preferences
- Presentation matters (separate foods)

**When to Seek Help:**
- Very limited diet (<20 foods)
- Nutritional concerns
- Choking/gagging
- Failure to thrive

A feeding therapist (SLP or OT) can help significantly.`,

  social: `Social skills development:

**Understanding:**
- Autistic social motivation may differ
- Quality > quantity of friendships
- Parallel play is valid
- Special interests can be bridges to connection

**Skill Building:**
- Social stories for specific situations
- Role-playing at home
- Identifying emotions (faces, body feelings)
- Teaching scripts for common situations

**Setting Up for Success:**
- Small group settings
- Structured activities (less pressure)
- Shared interests
- Clear expectations

**Friendship Looks Different:**
- Some prefer one deep friendship
- Online friendships are real friendships
- Adult relationships may be easier than peer

**Social Skills Groups:**
- Can be helpful with the right fit
- Look for neurodiversity-affirming approaches
- Avoid "masking" as a goal`,

  siblings: `Supporting siblings of autistic children:

**Common Feelings:**
- Jealousy of attention given to sibling
- Worry about their sibling
- Embarrassment (especially teens)
- Protectiveness
- Pressure to be "the easy one"

**What Helps:**
- One-on-one time with each child
- Age-appropriate explanations
- Sibling support groups
- Validation of their feelings
- Don't make them responsible for their sibling

**Family Dynamics:**
- Fair doesn't mean equal
- Celebrate each child's strengths
- Include them in discussions appropriately
- Resist the "mini-parent" role

**Resources:**
- Sibshops (workshops for siblings)
- Books: "Views from Our Shoes," "The Sisters Club"
- Family therapy if needed

Siblings often grow up to be compassionate, inclusive adults.`,

  transition: `Transitions can be challenging. Strategies that help:

**Visual Supports:**
- Visual schedules (pictures or words)
- First/Then boards
- Timers (visual timers often work best)
- Countdowns ("5 more minutes")

**Preparation:**
- Advance warning (but not too far)
- Social stories for new situations
- Visit new places beforehand if possible
- Photos of new teachers/places

**During Transitions:**
- Consistent routine
- Transition objects
- Calm, clear instructions
- Acknowledge feelings

**Big Transitions:**
- New school: Visit multiple times, meet team, photos
- Puberty: Prepare early, social stories, concrete language
- Adulthood: Start planning at 14 (legally required)

**Routines Matter:**
Predictability reduces anxiety. When change is necessary, extra support helps.`,

  resources: `Helpful resources for the autism community:

**National Organizations:**
- **Autism Society of America**: autism-society.org
- **Autism Speaks**: autismspeaks.org (toolkits available)
- **Autism Self Advocacy Network**: autisticadvocacy.org
- **STAR Institute**: sensory processing info

**Finding Providers:**
- **Psychology Today**: Filter for autism experience
- **Your insurance directory**
- **Local children's hospital**
- **Early Intervention** (birth-3): Free evaluation

**Financial Help:**
- **Autism Cares Foundation**: Emergency grants
- **ACT Today**: Therapy grants
- **SSDI/SSI**: For those who qualify
- **Medicaid Waivers**: Vary by state

**Community:**
- **Wolf + Friends app**: Connect with local families
- **Facebook groups** (search your city + autism)
- **Special Olympics**: Inclusive sports

You're not alone in this journey.`
};

// Keywords to match topics
const TOPIC_KEYWORDS: Record<string, string[]> = {
  greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', "what's up"],
  sleep: ['sleep', 'bedtime', 'night', 'insomnia', 'wake', 'tired', 'rest', 'nap'],
  behavior: ['behavior', 'tantrum', 'aggressive', 'hitting', 'kicking', 'defiant', 'oppositional', 'meltdown'],
  communication: ['speak', 'talk', 'communication', 'nonverbal', 'verbal', 'language', 'words', 'aac', 'pecs', 'speech'],
  school: ['school', 'iep', 'teacher', 'education', 'classroom', 'bully', 'accommodation', '504', 'learn'],
  diagnosis: ['diagnosis', 'diagnose', 'evaluate', 'assessment', 'developmental pediatrician', 'screening', 'red flag'],
  therapy: ['therapy', 'therapist', 'aba', 'ot', 'speech', 'pt', 'floortime', 'treatment', 'intervention', 'early intervention'],
  meltdown: ['meltdown', 'shutdown', 'overwhelm', 'regulate', 'calm down', 'crisis'],
  sensory: ['sensory', 'sound', 'noise', 'light', 'texture', 'touch', 'smell', 'taste', 'vestibular', 'proprioception', 'sensory processing'],
  eating: ['eat', 'food', 'meal', 'feeding', 'picky eater', 'nutrition', 'diet', 'swallow'],
  social: ['friend', 'social', 'play', 'peer', 'interaction', 'relationship', 'lonely', 'bully', 'isolated'],
  siblings: ['sibling', 'brother', 'sister', 'family', 'parent', 'caregiver stress'],
  transition: ['transition', 'change', 'routine', 'schedule', 'new school', 'move', 'puberty'],
  resources: ['resource', 'help', 'support', 'organization', 'funding', 'grant', 'financial', 'therapy cost']
};

/**
 * Detect the topic of a message
 */
function detectTopic(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      return topic;
    }
  }
  
  return 'default';
}

/**
 * Get fallback response for when AI providers fail
 */
export function getFallbackResponse(messages: ChatMessage[], _isStoryMode?: boolean): { reply: string; provider: 'fallback' } {
  const lastMessage = messages.at(-1)?.content || '';
  const topic = detectTopic(lastMessage);
  
  logger.debug({ topic }, 'Using fallback response');
  
  return {
    reply: FALLBACK_RESPONSES[topic] || FALLBACK_RESPONSES.default,
    provider: 'fallback'
  };
}

/**
 * Get crisis resources response
 */
export function getCrisisResources(): string {
  return CRISIS_RESOURCES;
}

/**
 * Check if a message indicates a crisis situation
 */
export function detectCrisisContent(message: string): boolean {
  const crisisKeywords = [
    'kill', 'murder', 'suicide', 'self-harm', 'cut myself', 
    'end my life', 'hurt someone', 'harm', 'abuse', 
    'weapon', 'gun', 'knife', 'explosive', 'bomb', 
    'poison', 'overdose', 'jump off', 'hang myself'
  ];
  
  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Get topic-specific educational content
 */
export function getTopicContent(topic: string): string | null {
  return FALLBACK_RESPONSES[topic] || null;
}

/**
 * List available fallback topics
 */
export function getAvailableTopics(): string[] {
  return Object.keys(FALLBACK_RESPONSES);
}

// Export the fallback service as an object for convenience
export const AIFallbackService = {
  getFallbackResponse,
  getCrisisResources,
  detectCrisisContent,
  getTopicContent,
  getAvailableTopics
};
