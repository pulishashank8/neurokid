// @vitest-environment jsdom
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ScreeningFlowPage from '@/app/screening/[group]/page';

// Mock mocks
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockUseParams = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
    }),
    useParams: () => mockUseParams(),
}));

describe('Screening Flow Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        window.sessionStorage.clear();
        // Default setup
        window.sessionStorage.setItem('nk-screening-intake', JSON.stringify({ age: 5, group: 'child' }));
        mockUseParams.mockReturnValue({ group: 'child' });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('calculates Child score correctly (High Risk - All Yes)', async () => {
        render(<ScreeningFlowPage />);

        // Loop through 20 questions
        for (let i = 0; i < 20; i++) {
            const yesBtns = screen.getAllByRole('button', { name: /Yes/i });
            fireEvent.click(yesBtns[0]);

            act(() => {
                vi.advanceTimersByTime(1000);
            });
        }

        // Now "See Results" should be available
        const resultBtn = screen.getByRole('button', { name: /See Results/i });
        expect(resultBtn).toBeEnabled();
        fireEvent.click(resultBtn);

        // Verify Storage
        const summary = JSON.parse(window.sessionStorage.getItem('nk-screening-summary') || '{}');
        expect(summary.score).toBe(100);
        expect(summary.category).toBe('High');
        expect(mockPush).toHaveBeenCalledWith('/screening/result');
    });

    it('calculates Toddler score correctly (Mixed Risk)', async () => {
        mockUseParams.mockReturnValue({ group: 'toddler' });
        window.sessionStorage.setItem('nk-screening-intake', JSON.stringify({ age: 2, group: 'toddler' }));
        render(<ScreeningFlowPage />);

        // Helpers
        const answer = (val: 'Yes' | 'No') => {
            const btns = screen.getAllByRole('button', { name: new RegExp(val, 'i') });
            fireEvent.click(btns[0]);
            act(() => {
                vi.advanceTimersByTime(1000);
            });
        };

        // Q1 (Normal): YES (0)
        answer('Yes');

        // Q2 (Reverse): YES (1) [Risk]
        answer('Yes');

        // Q3 (Normal): NO (1) [Risk]
        answer('No');

        // Q4 (Normal): NO (1) [Risk]
        answer('No');

        // Rest (Q5-Q20): SAFE
        // Reverse indices in array (0-based): 1, 4, 11 (Q2, Q5, Q12)
        // We are at loop index 4 (Q5).
        for (let i = 4; i < 20; i++) {
            if (i === 4 || i === 11) {
                // Reverse question. Safe = NO
                answer('No');
            } else {
                // Standard question. Safe = YES
                answer('Yes');
            }
        }

        // Submit
        const resultBtn = screen.getByRole('button', { name: /See Results/i });
        fireEvent.click(resultBtn);

        const summary = JSON.parse(window.sessionStorage.getItem('nk-screening-summary') || '{}');
        expect(summary.score).toBe(3);
        expect(summary.category).toBe('Moderate');
        expect(mockPush).toHaveBeenCalledWith('/screening/result');
    });


    it('See Results button enables only after all questions answered and navigates', async () => {
        mockUseParams.mockReturnValue({ group: 'child' });
        render(<ScreeningFlowPage />);

        // Fast-forward answering 19 questions
        for (let i = 0; i < 19; i++) {
            const yesBtns = screen.getAllByRole('button', { name: /Yes/i });
            fireEvent.click(yesBtns[0]);
            act(() => { vi.advanceTimersByTime(1000); });
        }

        // We auto-advanced 19 times, so we should be at index 19 (Question 20/20).
        expect(screen.getByText('20/20')).toBeInTheDocument();

        // The button changes label to "See Results" on the last question
        const resultBtn = screen.getByRole('button', { name: /See Results/i });

        // We haven't answered the 20th question yet.
        // The button should be disabled because "disabled={!allAnswered}"
        expect(resultBtn).toBeDisabled();

        // Answer the last question (Question 20)
        const yesBtns = screen.getAllByRole('button', { name: /Yes/i });
        fireEvent.click(yesBtns[0]);

        // Now it should be enabled
        expect(resultBtn).toBeEnabled();

        // Click it
        fireEvent.click(resultBtn);

        // Verify navigation
        expect(mockPush).toHaveBeenCalledWith('/screening/result');
        expect(window.sessionStorage.getItem('nk-screening-summary')).not.toBeNull();
    });
});
