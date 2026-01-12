const { formatCHF, deleteAssetByType, removeAsset, resetVermoegenswerte, getVermoegenswerte } = require('../script.js');

describe('ERBO - Scheidungsfälle und Erbrechner', () => {

    // formatCHF Tests
    describe('formatCHF - Currency Formatting', () => {
        
        // Test 1 - Given input of 100'000, format to 100'000 CHF 
        test('Format 100000 as CHF currency', () => {
            const result = formatCHF(100000);
            expect(result).toContain('CHF');
            expect(result).toContain('100');
        });
        // Test 2 - Given input of 50'000, format to 50'000 CHF 
        test('Format 50000 as CHF currency', () => {
            const result = formatCHF(50000);
            expect(result).toContain('CHF');
            expect(result).toContain('50');
        });
        // Test 3 - Given input of 0, format to 0 CHF
        test('Format 0 as CHF currency', () => {
            const result = formatCHF(0);
            expect(result).toContain('CHF');
            expect(result).toContain('0');
        });
        // Test 4 - Given number with decimals, format using ’ and .
        test('Format decimal amount correctly', () => {
            const result = formatCHF(1234.56);
            expect(result).toContain('CHF');
            expect(result).toContain("1’234.56");
        });

    });

    // deleteAssetByType Tests
    describe('deleteAssetByType - Asset Deletion', () => {
        
        beforeEach(() => {
            // Reset asset array before each test using proper setter
            resetVermoegenswerte([
                { art: 'Haus', wert: 500000 },
                { art: 'Auto', wert: 50000 },
                { art: 'Bankkonto', wert: 100000 }
            ]);
        });

        // Test 5 - Given asset 'Auto', delete first occurrence only
        test('Delete first occurrence of an asset type', () => {
            deleteAssetByType('Auto', false);
            const result = getVermoegenswerte();
            expect(result.length).toBe(2);
            expect(result.some(a => a.art === 'Auto')).toBe(false);
        });

        // Test 6 - Given lowercase 'auto', delete 'Auto' (case-insensitive)
        test('Delete asset with case-insensitive matching', () => {
            deleteAssetByType('auto', false);
            const result = getVermoegenswerte();
            expect(result.length).toBe(2);
            expect(result.some(a => a.art === 'Auto')).toBe(false);
        });

        // Test 7 - Given non-existent asset 'Flugzeug', array remains unchanged
        test('Do nothing if asset type does not exist', () => {
            const initialLength = getVermoegenswerte().length;
            deleteAssetByType('Flugzeug', false);
            expect(getVermoegenswerte().length).toBe(initialLength);
        });

        // Test 8 - Given multiple 'Auto' assets and all=true, delete all occurrences
        test('Delete all occurrences when all=true', () => {
            const current = getVermoegenswerte();
            current.push({ art: 'Auto', wert: 30000 });
            deleteAssetByType('Auto', true);
            expect(getVermoegenswerte().some(a => a.art === 'Auto')).toBe(false);
        });

    });

    // removeAsset Tests
    describe('removeAsset - Remove by Index', () => {
        
        beforeEach(() => {
            // Reset asset array before each test using proper setter
            resetVermoegenswerte([
                { art: 'Haus', wert: 500000 },
                { art: 'Auto', wert: 50000 },
                { art: 'Bankkonto', wert: 100000 }
            ]);
        });

        // Test 9 - Given index 0, remove first asset from array
        test('Remove asset at index 0', () => {
            removeAsset(0);
            const result = getVermoegenswerte();
            expect(result.length).toBe(2);
            expect(result[0].art).toBe('Auto');
        });

        // Test 10 - Given index 1, remove second asset from array
        test('Remove asset at index 1', () => {
            removeAsset(1);
            const result = getVermoegenswerte();
            expect(result.length).toBe(2);
            expect(result.some(a => a.art === 'Auto')).toBe(false);
        });

        // Test 11 - Given negative index -1, array remains unchanged
        test('Do nothing if index is out of bounds (negative)', () => {
            const initialLength = getVermoegenswerte().length;
            removeAsset(-1);
            expect(getVermoegenswerte().length).toBe(initialLength);
        });

        // Test 12 - Given out of bounds, array remains unchanged
        test('Do nothing if index is out of bounds (too high)', () => {
            const initialLength = getVermoegenswerte().length;
            removeAsset(999);
            expect(getVermoegenswerte().length).toBe(initialLength);
        });
    });
});