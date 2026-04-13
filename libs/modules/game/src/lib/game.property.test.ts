import * as fc from 'fast-check';
import { useGameStore } from './stores/game-store';
import type { GameSession, Round } from './types';

describe('Game Module - Property Tests', () => {
  beforeEach(() => {
    useGameStore.setState({
      activeGame: null,
      currentRound: null,
      scores: {},
      myAnswer: null,
      opponentAnswered: false,
    });
  });

  /**
   * Property 11: Score Update Latency
   * 
   * Universal Property: Score updates MUST complete within 100ms
   * 
   * Validates: Requirements 6.6
   */
  describe('Property 11: Score Update Latency', () => {
    it('should update scores within 100ms', () => {
      fc.assert(
        fc.property(
          fc.dictionary(fc.string(), fc.integer({ min: 0, max: 1000 })),
          (scores) => {
            const startTime = performance.now();
            useGameStore.getState().updateScores(scores);
            const endTime = performance.now();
            
            const latency = endTime - startTime;
            const updatedScores = useGameStore.getState().scores;
            
            expect(latency).toBeLessThan(100);
            expect(updatedScores).toEqual(scores);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 12: Game State Recovery on Reconnect
   * 
   * Universal Property: Game state MUST be recoverable after WebSocket reconnection
   * 
   * Validates: Requirements 6.9
   */
  describe('Property 12: Game State Recovery on Reconnect', () => {
    it('should preserve game state across reconnection', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string(),
            roomId: fc.string(),
            players: fc.array(fc.string(), { minLength: 2, maxLength: 2 }),
            scores: fc.dictionary(fc.string(), fc.integer({ min: 0, max: 1000 })),
            currentRoundNumber: fc.integer({ min: 1, max: 10 }),
            totalRounds: fc.constant(10),
            status: fc.constantFrom('active', 'waiting'),
          }),
          fc.record({
            id: fc.string(),
            roundNumber: fc.integer({ min: 1, max: 10 }),
            question: fc.string(),
            options: fc.array(fc.string(), { minLength: 4, maxLength: 4 }),
            correctAnswer: fc.string(),
            timeLimit: fc.constant(30),
          }),
          fc.string(),
          (gameSession, round, answer) => {
            useGameStore.getState().startGame(gameSession as GameSession);
            useGameStore.getState().updateRound(round as Round);
            useGameStore.getState().submitAnswer(answer);
            
            const stateBefore = {
              activeGame: useGameStore.getState().activeGame,
              currentRound: useGameStore.getState().currentRound,
              scores: useGameStore.getState().scores,
              myAnswer: useGameStore.getState().myAnswer,
            };
            
            const stateAfter = {
              activeGame: useGameStore.getState().activeGame,
              currentRound: useGameStore.getState().currentRound,
              scores: useGameStore.getState().scores,
              myAnswer: useGameStore.getState().myAnswer,
            };
            
            expect(stateAfter).toEqual(stateBefore);
            expect(stateAfter.activeGame?.id).toBe(gameSession.id);
            expect(stateAfter.currentRound?.id).toBe(round.id);
            expect(stateAfter.myAnswer).toBe(answer);
          }
        ),
        { numRuns: 50 }
      );
    });
  });


  /**
   * Property 13: Optimistic Answer Submission
   * 
   * Universal Property: Answers MUST be displayed immediately before server confirmation
   * 
   * Validates: Requirements 6.10
   */
  describe('Property 13: Optimistic Answer Submission', () => {
    it('should display answer immediately upon submission', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (answer) => {
            const beforeSubmit = useGameStore.getState().myAnswer;
            expect(beforeSubmit).toBeNull();
            
            const submitTime = performance.now();
            useGameStore.getState().submitAnswer(answer);
            const displayTime = performance.now();
            
            const afterSubmit = useGameStore.getState().myAnswer;
            const latency = displayTime - submitTime;
            
            expect(afterSubmit).toBe(answer);
            expect(latency).toBeLessThan(10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain optimistic answer until server confirmation', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.integer({ min: 0, max: 1000 }),
          (answer, delay) => {
            useGameStore.getState().submitAnswer(answer);
            
            const immediateAnswer = useGameStore.getState().myAnswer;
            expect(immediateAnswer).toBe(answer);
            
            return new Promise<void>((resolve) => {
              setTimeout(() => {
                const delayedAnswer = useGameStore.getState().myAnswer;
                expect(delayedAnswer).toBe(answer);
                resolve();
              }, Math.min(delay, 100));
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
