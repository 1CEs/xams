import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HUGGING_FACE_API_KEY);

const GRADING_CONFIG = {
  max_new_tokens: 300,
  temperature: 0.3,
  do_sample: true,
  return_full_text: false,
};

(async () => {
  const gradingPrompt = `
Grade this Short Essay answer fairly and accurately.
    QUESTION: """what is cryptocurrency?"""
    EXPECTED: """Cryptocurrency is a type of digital or virtual currency that uses cryptography for security OR Cryptocurrency is a type of digital or virtual currency that uses cryptography for Security"""
    STUDENT: """HELLO THIS IS MY ANSWER"""
    MAX SCORE: 1

    GRADING SCALE:

    - 90-100% (1-1): Matches expected meaning, even with different wording
    - 80-89% (1-1): Mostly correct, covers main points, minor gaps      
    - 70-79% (1-1): Reasonably correct but incomplete or unclear        
    - 50-69% (1-1): Partially correct, missing key points
    - 20-49% (0-0): Shows effort but mostly incorrect
    - 0-19% (0-0): Irrelevant, meaningless, internet slang (WTF, IDK, LOL), or nonsensical


    KEY RULES:
    - Same meaning as expected = 90-100%
    - Covers main points = minimum 80%
    - Random text/internet slang/meaningless = 0%


    REQUIRED FORMAT:
    SCORE: X/1 (XX%)
    ANALYSIS:
    - Accuracy: [brief explanation]
    - Completeness: [brief explanation]
    - Clarity: [brief explanation]
    REASON: [brief justification]
`;
  const result = await hf.chatCompletion({
    provider: "nebius",
    model: "google/gemma-3-27b-it",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: gradingPrompt,
          },
        ],
      },
    ],
    ...GRADING_CONFIG,
  });

  console.log('Full result:', result);
  console.log('AI Response:', result.choices[0].message.content);
})();
