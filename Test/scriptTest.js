/**
 * Test Cases: Nackommen und Eltern
 */

// Distribution logic for inheritance
function calculateInheritanceShares(familienMitglieder, gesamtVermoegen) {
    const shares = new Map();
    
    const isChild = (s) => /(^|\s)kind|kinder|sohn|tochter/i.test(s) && !/enkel/i.test(s);
    const isGrandchild = (s) => /enkel|enkelin/i.test(s);
    const parseGrandchildParent = (rel) => {
        if (!rel) return null;
        const match = rel.match(/von\s+(.+)$/i);
        if (match && match[1]) {
            return match[1].trim();
        }
        return null;
    };
    const isParent = (s) => /eltern|mutter|vater/i.test(s) && !/grosseltern|grossmutter|grossvater/i.test(s);
    const isSibling = (s) => /geschwister|bruder|schwester/i.test(s);
    const isGrandparent = (s) => /grosseltern|grossmutter|grossvater|oma|opa/i.test(s);

    const addShare = (personName, amount) => {
        if (!personName) return;
        const prev = shares.get(personName) || 0;
        shares.set(personName, prev + amount);
    };

    const children = familienMitglieder.filter(p => isChild(p.beziehung));
    const parents = familienMitglieder.filter(p => isParent(p.beziehung));
    const siblings = familienMitglieder.filter(p => isSibling(p.beziehung));
    const grandparents = familienMitglieder.filter(p => isGrandparent(p.beziehung));

    if (children.length > 0) {
        const totalBranches = children.length + (grandparents.length > 0 ? 1 : 0);
        const perBranch = gesamtVermoegen / totalBranches;
        children.forEach(c => addShare(c.name, perBranch));
        if (grandparents.length > 0) {
            const perGrandchild = perBranch / grandparents.length;
            grandparents.forEach(gp => addShare(gp.name, perGrandchild));
        }
    } 
    else if (parents.length > 0) {
        const perParent = gesamtVermoegen / parents.length;
        parents.forEach(p => addShare(p.name, perParent));
    }
    else if (siblings.length > 0) {
        const perSibling = gesamtVermoegen / siblings.length;
        siblings.forEach(s => addShare(s.name, perSibling));
    }
    else if (grandparents.length > 0) {
        const perGrandparent = gesamtVermoegen / grandparents.length;
        grandparents.forEach(gp => addShare(gp.name, perGrandparent));
    }

    return shares;
}

describe('Nachkommen und Eltern', () => {

    test('Test 6.1: Two children inherit equally', () => {
        
        const family = [
            { name: 'Kind1', beziehung: 'Kind' },
            { name: 'Kind2', beziehung: 'Kind' }
        ];
        
        const totalAssets = 100000;
        const shares = calculateInheritanceShares(family, totalAssets);
        
        expect(shares.get('Kind1')).toBe(50000);
        expect(shares.get('Kind2')).toBe(50000);
    });

    test('Test 6.2: One child and two grandchildren', () => {
        
        const family = [
            { name: 'Kind', beziehung: 'Kind' },
            { name: 'Enkel1', beziehung: 'Enkel von Kind' },
            { name: 'Enkel2', beziehung: 'Enkel von Kind' }
        ];
        
        const totalAssets = 200000;
        const shares = calculateInheritanceShares(family, totalAssets);
        
        expect(shares.get('Kind')).toBe(100000);
        expect(shares.get('Enkel1')).toBe(50000);
        expect(shares.get('Enkel2')).toBe(50000);
    });

    test('Test 7.1: Two parents inherit equally', () => {
        
        const family = [
            { name: 'Eltern1', beziehung: 'Elternteil' },
            { name: 'Eltern2', beziehung: 'Elternteil' }
        ];
        
        const totalAssets = 100000;
        const shares = calculateInheritanceShares(family, totalAssets);
        
        expect(shares.get('Eltern1')).toBe(50000);
        expect(shares.get('Eltern2')).toBe(50000);
    });

});