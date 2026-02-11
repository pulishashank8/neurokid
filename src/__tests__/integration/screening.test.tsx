/**
 * Screening flow integration tests.
 * Tests screening scoring outcomes (same logic as UI flow) without requiring DOM render.
 * Full UI E2E: use Playwright when needed.
 */
import { calculateChildScore, calculateToddlerScore } from '@/app/screening/scoring';

describe('Screening Flow Integration', () => {
    it('calculates Child score correctly (High Risk - All Yes)', () => {
        const answers = Array(20).fill('yes');
        const result = calculateChildScore(answers);

        expect(result.score).toBe(100);
        expect(result.category).toBe('High');
        expect(result.rawScore).toBe(20);
        expect(result.maxScore).toBe(20);
        expect(result.group).toBe('child');
    });

    it('calculates Toddler score correctly (Mixed Risk)', () => {
        // Same answer array as screening-scoring.test.ts (Q2 rev=risk, Q3 no=risk, Q4 no=risk)
        const answers = [
            'yes', 'yes', 'no', 'no', 'no',  // Q1-5: Q2 reverse yes, Q3/Q4 normal no = 3 risk
            'yes', 'yes', 'yes', 'yes', 'yes',
            'yes', 'no', 'yes', 'yes', 'yes',
            'yes', 'yes', 'yes', 'yes', 'yes',
        ];
        const result = calculateToddlerScore(answers);

        expect(result.rawScore).toBe(3);
        expect(result.category).toBe('Moderate');
        expect(result.group).toBe('toddler');
    });

    it('produces valid summary for See Results when all 20 questions answered', () => {
        const answers = Array(20).fill('yes');
        const result = calculateChildScore(answers);

        expect(result).toMatchObject({
            score: 100,
            category: 'High',
            rawScore: 20,
            maxScore: 20,
            group: 'child',
        });
        expect(typeof result.interpretation).toBe('string');
        expect(result.interpretation.length).toBeGreaterThan(0);
    });
});
