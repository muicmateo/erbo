// ========== DATA ==========
let familyMembers = []; 
let assets = [];
let divisionSelected = false;

function resetAssets(newArray = []) {
    assets = newArray;
}

function resetFamilyMembers(newArray = []) {
    familyMembers = newArray;
}

const formatCHF = (value) => {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value);
};

if (typeof module === 'undefined' || !module.exports) {
    initializeApp();
}

function initializeApp() {
    const sections = {
        family: document.getElementById('family'),
        assets: document.getElementById('assets'),
        calculation: document.getElementById('calculation'),
        result: document.getElementById('result')
    };

    let currentScenario = localStorage.getItem('erbo_last_scenario') || 'death'; 

    document.getElementById('opt-death').addEventListener('click', () => switchScenario('death'));
    document.getElementById('opt-divorce').addEventListener('click', () => switchScenario('divorce'));

    // Auto-Scroll-Function
    function smartScroll(elementId, toBottom = false) {
        if (toBottom) {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            const element = document.getElementById(elementId);
            const navbarHeight = 150; 
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - navbarHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    // ========== LOCK FUNCTION ==========
    function lockStep(stepId) {
        const section = document.getElementById(stepId);
        const indicator = document.querySelector(`.step[data-step="${stepId}"]`);
        if (!section) return;

        section.classList.add('locked');
        section.classList.remove('active');

        if (!section.querySelector('.blur-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'blur-overlay';
            
            let msg = "🔒 Zuerst vorherigen Schritt abschliessen";
            if (stepId === 'result') msg = "🔒";
            
            overlay.innerHTML = `<div class="lock-message">${msg}</div>`;
            section.insertBefore(overlay, section.firstChild);
        }

        if (indicator) indicator.classList.remove('active');
    }

    // ========== SCENARIO LOGIC ==========
    function switchScenario(scenario) {
        if (currentScenario !== scenario) {
            familyMembers = [];
            assets = [];
            renderFamilyList();
            renderAssetList();
            document.getElementById('name-input').value = '';
            document.getElementById('asset-name').value = '';
            document.getElementById('asset-value').value = '';
            
            document.getElementById('result-content').innerHTML = '';
            lockStep('result'); 
        }

        currentScenario = scenario;
        localStorage.setItem('erbo_last_scenario', scenario);

        document.querySelector('input[value="death"]').checked = (scenario === 'death');
        document.querySelector('input[value="divorce"]').checked = (scenario === 'divorce');

        document.getElementById('opt-death').classList.toggle('selected', scenario === 'death');
        document.getElementById('opt-divorce').classList.toggle('selected', scenario === 'divorce');

        const sectionFamily = document.getElementById('family');
        const sectionInfo = document.getElementById('divorce-info');
        const simpleEstateWrapper = document.getElementById('simple-estate-wrapper');
        const familySubtitle = document.querySelector('#family .subtitle');

        if (scenario === 'divorce') {
            // --- MODE DIVORCE ---
            sectionFamily.style.display = 'none';
            sectionInfo.style.display = 'none'; 
            sectionInfo.classList.remove('active');

            document.getElementById('step-nav-1').innerText = "1. Modus";
            
            if(simpleEstateWrapper) simpleEstateWrapper.style.display = 'none';

            showAssetInputs(true, true);

            unlockStep('assets');
            document.getElementById('assets').classList.add('active');
            smartScroll('assets');
            
            lockStep('result');

        } else {
            // --- MODE DEATH ---
            sectionFamily.style.display = 'block';
            sectionInfo.style.display = 'none';
            
            document.getElementById('step-nav-1').innerText = "1. Familie";
            
            if(familySubtitle) familySubtitle.innerText = "Erfassen Sie die lebenden Verwandten.";

            if(simpleEstateWrapper) simpleEstateWrapper.style.display = 'none';
            
            if (familyMembers.length === 0) {
                lockStep('assets'); 
                lockStep('result');
                
                document.getElementById('family').classList.add('active');
                smartScroll('family');
            }

            checkAssetDetailsRequirements();
        }
    }
    window.switchScenario = switchScenario;

    function showAssetInputs(showOwner, showType) {
        const ownerContainer = document.getElementById('container-owner');
        const typeContainer = document.getElementById('container-type');
        const subtitle = document.getElementById('asset-subtitle');

        ownerContainer.style.display = showOwner ? 'block' : 'none';
        typeContainer.style.display = showType ? 'block' : 'none';

        if (!showOwner && !showType) {
            subtitle.innerText = "Alles fliesst direkt in die Erbmasse.";
        } else if (!showOwner && showType) {
            subtitle.innerText = "Erfassen Sie Vermögen des Verstorbenen (Güterstand relevant).";
        } else {
            subtitle.innerText = "Erfassen Sie Eigentümer und Art.";
        }
    }

    function checkAssetDetailsRequirements() {
        if (currentScenario === 'death') {
            showAssetInputs(false, false);
            return;
        }

        const simpleCheckbox = document.getElementById('simple-estate-checkbox');
        if (simpleCheckbox && simpleCheckbox.checked) {
            showAssetInputs(false, false);
            return;
        }
        
        showAssetInputs(true, true);
    }

    function toggleAssetDetails() {
        checkAssetDetailsRequirements();
    }
    window.toggleAssetDetails = toggleAssetDetails;

    function unlockStep(stepId) {
        const section = document.getElementById(stepId);
        const indicator = document.querySelector(`.step[data-step="${stepId}"]`);
        if (!section) return;
        
        section.classList.remove('locked');
        const overlay = section.querySelector('.blur-overlay');
        if (overlay) overlay.remove();
        
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        if (indicator) indicator.classList.add('active');
    }

    // ========== STEP 1: FAMILY ==========
    const nameInput = document.getElementById('name-input');
    const relationshipSelect = document.getElementById('relationship-select');
    const statusSelect = document.getElementById('status-select');
    const parentGroup = document.getElementById('parent-group');
    const parentInput = document.getElementById('parent-input');
    const familyList = document.getElementById('family-list');
    const completeFamilyBtn = document.getElementById('complete-family');
    const noFamilyCheckbox = document.getElementById('no-family-checkbox');
    const familyInputsDiv = document.getElementById('family-inputs');

    noFamilyCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            familyMembers = [];
            renderFamilyList();
            familyInputsDiv.style.opacity = '0.5';
            familyInputsDiv.style.pointerEvents = 'none';
            completeFamilyBtn.disabled = false;
            checkAssetDetailsRequirements();
        } else {
            familyInputsDiv.style.opacity = '1';
            familyInputsDiv.style.pointerEvents = 'auto';
            renderFamilyList();
        }
    });

    function toggleParentInput() {
        const val = relationshipSelect.value;
        const needsParent = ['grandchild', 'greatGrandchild', 'nieceNephew', 'cousin'].includes(val);
        if (needsParent) {
            parentGroup.classList.remove('hidden');
            updateParentDropdown();
        }
        else parentGroup.classList.add('hidden');
    }
    window.toggleParentInput = toggleParentInput;

    function updateParentDropdown() {
        parentInput.innerHTML = '<option value="" disabled selected>Elternteil wählen...</option>';
        familyMembers.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.textContent = p.name;
            parentInput.appendChild(opt);
        });
    }

    function renderFamilyList() {
        familyList.innerHTML = '';
        
        if (familyMembers.length === 0) {
            if (noFamilyCheckbox.checked) {
                familyList.classList.remove('empty-state');
                familyList.innerHTML = '<div style="padding:10px; color:#e67e22; font-weight:bold;">Der Staat erbt (Keine Verwandten).</div>';
                completeFamilyBtn.disabled = false;
            } else {
                familyList.classList.add('empty-state');
                familyList.innerHTML = '<span class="placeholder-text">Keine Personen</span>';
                completeFamilyBtn.disabled = true;
            }
            if(currentScenario === 'death') checkAssetDetailsRequirements();
            return;
        }

        familyList.classList.remove('empty-state');
        completeFamilyBtn.disabled = false;

        if(currentScenario === 'death') checkAssetDetailsRequirements();

        const roleMap = {
            spouse: 'Ehepartner',
            child: 'Kind',
            grandchild: 'Enkel',
            greatGrandchild: 'Urenkel',
            parent: 'Elternteil',
            sibling: 'Geschwister',
            nieceNephew: 'Nichte/Neffe',
            grandparent: 'Grosseltern',
            uncleAunt: 'Onkel/Tante',
            cousin: 'Cousin/e'
        };

        familyMembers.forEach((person, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            const statusIcon = person.status === 'deceased' ? '⚰️' : '👤';
            const statusStyle = person.status === 'deceased' ? 'color:#95a5a6; text-decoration:line-through;' : '';
            
            let displayRole = roleMap[person.relationship] || person.relationship;

            let info = `<span style="${statusStyle}"><b>${statusIcon} ${person.name}</b> <small>(${displayRole})</small></span>`;
            
            const lineageRoles = ['child', 'sibling', 'parent'];
            if (person.parent && !lineageRoles.includes(person.relationship)) {
                info += `<br><small style="color:#7f8c8d; margin-left:25px;">↳ Kind von: ${person.parent}</small>`;
            }

            item.innerHTML = `<div>${info}</div><button onclick="removeFamilyMember(${index})" style="color:red;border:none;background:none;cursor:pointer;">&times;</button>`;
            familyList.appendChild(item);
        });
    }

    function removeFamilyMember(index) {
        familyMembers.splice(index, 1);
        renderFamilyList();
    }
    window.removeFamilyMember = removeFamilyMember;

    document.querySelector('#family .add-button').addEventListener('click', () => {
        const name = nameInput.value.trim();
        const relationship = relationshipSelect.value;
        const status = statusSelect.value;
        let parent = parentInput.value;

        if (!name || !relationship) return alert("Bitte Name und Beziehung angeben");
        
        const exists = familyMembers.some(p => p.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            return alert("Dieser Name existiert bereits. Bitte verwenden Sie eindeutige Namen (z.B. 'Anna B.').");
        }

        if (relationship === 'spouse' && familyMembers.some(p => p.relationship === 'spouse')) {
            return alert("Es gibt nur einen Ehepartner.");
        }

        if (relationship === 'child' || relationship === 'sibling' || relationship === 'parent') {
            parent = name; 
        } else {
            if (!parentGroup.classList.contains('hidden') && !parent) {
                return alert("Bitte wählen Sie ein Elternteil aus der Liste aus.");
            }
        }

        familyMembers.push({ name, relationship, status, parent });
        renderFamilyList();
        
        nameInput.value = '';
        parentInput.value = '';
        relationshipSelect.value = '';
        statusSelect.value = 'alive'; 
        toggleParentInput();
    });

    completeFamilyBtn.addEventListener('click', () => {
        document.getElementById('family').classList.remove('active');
        unlockStep('assets');
        document.getElementById('assets').classList.add('active');
        smartScroll('assets');
    });

    // ========== STEP 2: ASSETS ==========
    const assetList = document.getElementById('asset-list');
    const addAssetBtn = document.querySelector('#assets .add-button');
    const assetNameInput = document.getElementById('asset-name');
    const assetValueInput = document.getElementById('asset-value');
    const assetOwnerSelect = document.getElementById('asset-owner');
    const assetCategorySelect = document.getElementById('asset-category');
    const completeAssetBtn = document.getElementById('complete-assets');

    function renderAssetList() {
        assetList.innerHTML = '';
        if (assets.length === 0) {
            assetList.classList.add('empty-state');
            assetList.innerHTML = '<span class="placeholder-text">Leer</span>';
            completeAssetBtn.disabled = true;
            return;
        }
        completeAssetBtn.disabled = false;
        assetList.classList.remove('empty-state');

        const ownerVisible = document.getElementById('container-owner').style.display !== 'none';
        const typeVisible = document.getElementById('container-type').style.display !== 'none';

        let sum = 0;

        assets.forEach((v, index) => {
            sum += v.value;
            const item = document.createElement('div');
            item.className = 'list-item';
            let subText = "";
            
            if (!ownerVisible && !typeVisible) {
                // Death Case
            } else if (!ownerVisible && typeVisible) {
                subText = `<br><small>Erblasser | ${v.category === 'acquest' ? 'Errungenschaft' : 'Eigengut'}</small>`;
            } else {
                // Divorce Case
                let ownerLabel = v.owner === 'A' ? (currentScenario === 'death' ? 'Erblasser' : 'Partner A') : (currentScenario === 'death' ? 'Ehepartner' : 'Partner B');
                let catLabel = v.category === 'acquest' ? 'Errungenschaft' : 'Eigengut';
                subText = `<br><small>${ownerLabel} | ${catLabel}</small>`;
            }

            item.innerHTML = `<div><b>${v.name}</b>${subText}</div><div style="display:flex;gap:10px;"><b>${formatCHF(v.value)}</b><button onclick="removeAsset(${index})" style="color:red;border:none;background:none;cursor:pointer;">&times;</button></div>`;
            assetList.appendChild(item);
        });
        assetList.prepend(Object.assign(document.createElement('div'), {className:'asset-total', innerHTML:`Total: ${formatCHF(sum)}`}));
    }
    window.renderAssetList = renderAssetList;

    addAssetBtn.addEventListener('click', () => {
        const name = assetNameInput.value.trim();
        const valueStr = assetValueInput.value;
        const value = parseFloat(valueStr);

        if (!name) return alert("Bitte geben Sie eine Bezeichnung ein.");
        if (isNaN(value)) return alert("Bitte geben Sie eine gültige Zahl ein.");
        if (value < 0) return alert("Der Wert darf nicht negativ sein.");
        
        let owner = 'A';
        let category = 'individual';

        if (currentScenario === 'divorce') {
            const ownerVisible = document.getElementById('container-owner').style.display !== 'none';
            const typeVisible = document.getElementById('container-type').style.display !== 'none';
            if (ownerVisible) owner = assetOwnerSelect.value;
            if (typeVisible) category = assetCategorySelect.value;
        }

        assets.push({name, value, owner, category});
        renderAssetList();
        assetNameInput.value=''; assetValueInput.value='';
    });

    completeAssetBtn.addEventListener('click', () => {
        document.getElementById('assets').classList.remove('active');
        unlockStep('result');
        document.getElementById('result').classList.add('active');
        calculateResult();
        smartScroll(null, true);
    });

    // ========== STEP 3: CALCULATION OF RESULT ==========
    function calculateResult() {
        const container = document.getElementById('result-content');
        container.innerHTML = '';

        let a_individual = 0, a_acquest = 0, b_individual = 0, b_acquest = 0;
        
        assets.forEach(v => {
            if (v.owner === 'A') v.category === 'individual' ? a_individual += v.value : a_acquest += v.value;
            else v.category === 'individual' ? b_individual += v.value : b_acquest += v.value;
        });
        
        const totalAcquest = a_acquest + b_acquest;
        const halfSurplus = totalAcquest / 2;

        if (currentScenario === 'divorce') {
            const finalA = a_individual + halfSurplus;
            const finalB = b_individual + halfSurplus;

            container.innerHTML = `
                <div style="text-align:center;margin-bottom:20px;">
                    <h3 style="color:#e67e22">Scheidungsergebnis</h3>
                    <p>Güterrechtliche Teilung</p>
                </div>
                <div class="split-view">
                    <div class="result-card">
                        <h4>Partner A (Du)</h4>
                        <p>Eigengut: ${formatCHF(a_individual)}</p>
                        <p style="color:#7f8c8d">+ 1/2 Errungenschaft: ${formatCHF(halfSurplus)}</p>
                        <hr>
                        <p class="final-sum">Endvermögen: ${formatCHF(finalA)}</p>
                    </div>
                    <div class="result-card">
                        <h4>Partner B</h4>
                        <p>Eigengut: ${formatCHF(b_individual)}</p>
                        <p style="color:#7f8c8d">+ 1/2 Errungenschaft: ${formatCHF(halfSurplus)}</p>
                        <hr>
                        <p class="final-sum">Endvermögen: ${formatCHF(finalB)}</p>
                    </div>
                </div>`;
            return;
        }

        // --- DEATH SCENARIO ---
        const livingSpouse = familyMembers.find(p => p.relationship === 'spouse' && p.status === 'alive');
        let spouseShare = 0;
        let estate = 0;

        if (livingSpouse) {
            spouseShare = 0;
            estate = a_individual; 
        } else {
            estate = a_individual;
        }

        let html = `
            <div style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px;">
                <div style="background:#eaf2f8; padding:10px; border-radius:5px; margin-top:10px;">
                    <strong>Zu verteilende Erbmasse: ${formatCHF(estate)}</strong>
                </div>
            </div>
            <h3>2. Erbteilung</h3>`;

        let shares = [];

        const distributeByBranch = (heirs, totalAmount, rootType) => {
            let potentialBranchNames = new Set();
            heirs.forEach(h => {
                if (h.relationship === rootType) potentialBranchNames.add(h.name);
                if (h.parent) potentialBranchNames.add(h.parent);
            });
            
            let validBranches = [];
            potentialBranchNames.forEach(branchName => {
                const root = familyMembers.find(p => p.name === branchName && p.relationship === rootType && p.status === 'alive');
                const livingDescendants = heirs.filter(h => h.parent === branchName && h.status === 'alive');
                if (root || livingDescendants.length > 0) validBranches.push(branchName);
            });

            if (validBranches.length === 0) return;

            const sharePerBranch = totalAmount / validBranches.length;
            
            validBranches.forEach(branchName => {
                const rootPerson = familyMembers.find(p => p.name === branchName && p.relationship === rootType);
                const isRootAlive = rootPerson && rootPerson.status === 'alive';

                if (isRootAlive) {
                    shares.push({ name: rootPerson.name, value: sharePerBranch, note: `${rootType} (lebt)` });
                    const descendants = heirs.filter(h => h.parent === branchName && h !== rootPerson);
                    descendants.forEach(d => shares.push({ name: d.name, value: 0, note: `Verdrängt durch ${rootPerson.name}` }));
                } else {
                    const livingDescendants = heirs.filter(h => h.parent === branchName && h.status === 'alive');
                    const sharePerDescendant = sharePerBranch / livingDescendants.length;
                    
                    livingDescendants.forEach(d => shares.push({ name: d.name, value: sharePerDescendant, note: `Eintritt für ${branchName}` }));
                    
                    if (rootPerson) shares.push({ name: rootPerson.name, value: 0, note: "Verstorben" });
                }
            });
        };

        // Parentels
        const p1 = familyMembers.filter(p => ['child', 'grandchild', 'greatGrandchild'].includes(p.relationship));
        const p2 = familyMembers.filter(p => ['parent', 'sibling', 'nieceNephew'].includes(p.relationship));
        const p3 = familyMembers.filter(p => ['grandparent', 'uncleAunt', 'cousin'].includes(p.relationship));

        const hasLivingP1 = p1.some(p => p.status === 'alive');
        const hasLivingP2 = p2.some(p => p.status === 'alive');
        const hasLivingP3 = p3.some(p => p.status === 'alive');

        // 1. Parentel
        if (hasLivingP1) {
            let partSpouse = 0, partKids = estate;
            if (livingSpouse) {
                partSpouse = estate / 2;
                partKids = estate / 2;
                shares.push({ name: livingSpouse.name, value: partSpouse, note: "Ehepartner (1/2)" });
            }
            distributeByBranch(p1, partKids, 'child');
        } 
        // 2. Parentel
        else if (hasLivingP2) {
            let partSpouse = 0, partParents = estate;
            if (livingSpouse) {
                partSpouse = estate * 0.75;
                partParents = estate * 0.25;
                shares.push({ name: livingSpouse.name, value: partSpouse, note: "Ehepartner (3/4)" });
            }
            
            const halfForSide = partParents / 2;
            const parents = p2.filter(p => p.relationship === 'parent');
            
            let parentSlots = [];
            if (parents[0]) parentSlots.push(parents[0]); else parentSlots.push({name:'Unbekannt1', status:'deceased'});
            if (parents[1]) parentSlots.push(parents[1]); else parentSlots.push({name:'Unbekannt2', status:'deceased'});
            
            const siblingsAndNieces = p2.filter(p => ['sibling', 'nieceNephew'].includes(p.relationship));

            parentSlots.forEach(parent => {
                if (parent.status === 'alive') {
                    shares.push({ name: parent.name, value: halfForSide, note: "Elternteil (lebt)" });
                } else {
                    if (siblingsAndNieces.some(p => p.status === 'alive')) {
                        distributeByBranch(siblingsAndNieces, halfForSide, 'sibling');
                    } else {
                        shares.push({ name: "Staat / Andere Seite", value: 0, note: "Stammseite leer" });
                    }
                }
            });
        }
        // 3. Parentel
        else if (hasLivingP3) {
            if (livingSpouse) {
                shares.push({ name: livingSpouse.name, value: estate, note: "Alleinerbe (Art. 462 Ziff. 3)" });
            } else {
                const livingP3 = p3.filter(p => p.status === 'alive');
                const share = estate / livingP3.length;
                livingP3.forEach(p => shares.push({ name: p.name, value: share, note: "3. Parentel" }));
            }
        }
        else {
            if (livingSpouse) {
                 shares.push({ name: livingSpouse.name, value: estate, note: "Alleinerbe" });
            } else {
                 shares.push({ name: "Kanton / Gemeinde", value: estate, note: "Keine erbberechtigten Verwandten" });
            }
        }

        shares.forEach(s => {
            if (s.value > 0 || s.note.includes("Verdrängt") || s.note.includes("Verstorben") || s.note.includes("Staat") || s.note.includes("leer")) {
                 let color = s.value > 0 ? '#27ae60' : '#95a5a6';
                 let style = s.value === 0 ? 'text-decoration:line-through; opacity:0.7;' : '';
                 html += `<div class="list-item" style="${style}"><span><b>${s.name}</b> <small>(${s.note})</small></span><span style="color:${color};font-weight:bold;">${formatCHF(s.value)}</span></div>`;
            }
        });

        container.innerHTML = html;
    }

    switchScenario(currentScenario);
}

function removeAsset(i) {
    if (i < 0 || i >= assets.length) return;
    assets.splice(i, 1);
    if (typeof renderAssetList !== 'undefined') renderAssetList();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCHF,
        removeAsset,
        resetVermoegenswerte: resetAssets, // Alias for backward compatibility if needed
        resetFamilienMitglieder: resetFamilyMembers,
        getVermoegenswerte: () => assets,
        getFamilienMitglieder: () => familyMembers
    };
}
