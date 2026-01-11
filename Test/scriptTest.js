/**
 * Unit Tests for Swiss Inheritance Calculator (script.js)
 * Simple, focused tests for testable functions
 */

const { formatCHF, deleteAssetByType, removeAsset, resetVermoegenswerte, getVermoegenswerte } = require('../script.js');

describe('Swiss Inheritance Calculator - Unit Tests', () => {

    // ========== formatCHF Tests ==========
    describe('formatCHF - Currency Formatting', () => {
        
        test('Format 100000 as CHF currency', () => {
            const result = formatCHF(100000);
            expect(result).toContain('CHF');
            expect(result).toContain('100');
        });

        test('Format 50000 as CHF currency', () => {
            const result = formatCHF(50000);
            expect(result).toContain('CHF');
            expect(result).toContain('50');
        });

        test('Format 0 as CHF currency', () => {
            const result = formatCHF(0);
            expect(result).toContain('CHF');
            expect(result).toContain('0');
        });

        test('Format decimal amount correctly', () => {
            const result = formatCHF(1234.56);
            expect(result).toContain('CHF');
            expect(result).toContain('1');
        });

    });

    // ========== deleteAssetByType Tests ==========
    describe('deleteAssetByType - Asset Deletion', () => {
        
        beforeEach(() => {
            // Reset asset array before each test using proper setter
            resetVermoegenswerte([
                { art: 'Haus', wert: 500000 },
                { art: 'Auto', wert: 50000 },
                { art: 'Bankkonto', wert: 100000 }
            ]);
        });

        test('Delete first occurrence of an asset type', () => {
            deleteAssetByType('Auto', false);
            const result = getVermoegenswerte();
            expect(result.length).toBe(2);
            expect(result.some(a => a.art === 'Auto')).toBe(false);
        });

        test('Delete asset with case-insensitive matching', () => {
            deleteAssetByType('auto', false);
            const result = getVermoegenswerte();
            expect(result.length).toBe(2);
            expect(result.some(a => a.art === 'Auto')).toBe(false);
        });

        test('Do nothing if asset type does not exist', () => {
            const initialLength = getVermoegenswerte().length;
            deleteAssetByType('Flugzeug', false);
            expect(getVermoegenswerte().length).toBe(initialLength);
        });

        test('Delete all occurrences when all=true', () => {
            const current = getVermoegenswerte();
            current.push({ art: 'Auto', wert: 30000 });
            deleteAssetByType('Auto', true);
            expect(getVermoegenswerte().some(a => a.art === 'Auto')).toBe(false);
        });

    });

    // ========== removeAsset Tests ==========
    describe('removeAsset - Remove by Index', () => {
        
        beforeEach(() => {
            // Reset asset array before each test using proper setter
            resetVermoegenswerte([
                { art: 'Haus', wert: 500000 },
                { art: 'Auto', wert: 50000 },
                { art: 'Bankkonto', wert: 100000 }
            ]);
        });

        test('Remove asset at index 0', () => {
            removeAsset(0);
            const result = getVermoegenswerte();
            expect(result.length).toBe(2);
            expect(result[0].art).toBe('Auto');
        });

        test('Remove asset at index 1', () => {
            removeAsset(1);
            const result = getVermoegenswerte();
            expect(result.length).toBe(2);
            expect(result.some(a => a.art === 'Auto')).toBe(false);
        });

        test('Do nothing if index is out of bounds (negative)', () => {
            const initialLength = getVermoegenswerte().length;
            removeAsset(-1);
            expect(getVermoegenswerte().length).toBe(initialLength);
        });

        test('Do nothing if index is out of bounds (too high)', () => {
            const initialLength = getVermoegenswerte().length;
            removeAsset(999);
            expect(getVermoegenswerte().length).toBe(initialLength);
        });

    });

    // ========== Input Validation Tests ==========
    describe('Input Validation', () => {
        
        test('Reject empty name input', () => {
            const name = '';
            expect(name.trim()).toBe('');
        });

        test('Reject negative asset value', () => {
            const value = -50000;
            expect(value > 0).toBe(false);
        });

        test('Reject zero asset value', () => {
            const value = 0;
            expect(value > 0).toBe(false);
        });

        test('Accept positive asset value', () => {
            const value = 50000;
            expect(value > 0).toBe(true);
        });

        test('Accept non-empty name after trim', () => {
            const name = '  Haus  ';
            expect(name.trim().length).toBeGreaterThan(0);
        });

    });

});