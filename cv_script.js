window.addEventListener('DOMContentLoaded', async function () {
    try {
        // 1. CONFIG
        const assetPath = window.ASSET_PATH || '';
        const urlParams = new URLSearchParams(window.location.search);
        const usePrivate = urlParams.has('private');

        let cv;

        // 2. LOAD DATA
        if (usePrivate) {
            try {
                const response = await fetch('cv.private.json');
                if (!response.ok) throw new Error("Private file not found");
                cv = await response.json();
                console.log("🔒 Loaded PRIVATE Data");
            } catch (e) {
                console.warn("Fallback to public");
                const response = await fetch('cv.json');
                cv = await response.json();
            }
        } else {
            const response = await fetch('cv.json');
            cv = await response.json();
            console.log("🌍 Loaded PUBLIC Data");
        }

        // --- 1. PRE-CALCULATE SKILLS (For Summary Append) ---
        const skillsByGroup = {};
        (cv.skills || []).forEach(skill => {
            const g = (skill.keywords && skill.keywords.length) ? skill.keywords[0] : 'Other';
            if (!skillsByGroup[g]) skillsByGroup[g] = [];
            skillsByGroup[g].push(skill);
        });

        // Remove Soft Skills from sidebar and prep string for summary
        const softGroupKey = 'Core Competencies';
        const softSkillsGroup = skillsByGroup[softGroupKey] || [];
        const softSkillsText = softSkillsGroup.map(s => s.name).join(', ');
        if (softSkillsText) delete skillsByGroup[softGroupKey];

        function parseRating(level) {
            if (!level) return 0;
            if (typeof level === 'string' && level.indexOf('/') !== -1) return parseInt(level.split('/')[0], 10);
            return parseInt(level, 10) || 0;
        }

        // --- BASIC INFO ---
        const nameEl = document.getElementById('sidebar-name');
        if (nameEl) nameEl.textContent = cv.basics?.name?.toUpperCase() || '';
        const jobWideEl = document.getElementById('job-title-wide');
        if (jobWideEl) jobWideEl.textContent = cv.basics?.label || '';

        // Summary Injection (Skills + Languages)
        const summaryEl = document.querySelector('.card.profile p');
        if (summaryEl) {
            let summaryHTML = cv.basics?.summary || '';

            if (cv.languages && cv.languages.length > 0) {
                // Create string: "English (Bilingual), Spanish (Native)..."
                const langString = cv.languages.map(l => {
                    return `${l.language} ${l.fluency ? `(${l.fluency})` : ''}`;
                }).join(', ');

                // Add to summary (New line)
                summaryHTML += `<br><strong style="color:var(--teal)">Languages:</strong> ${langString}.`;
            }

            // 1. Append Core Competencies (Cyberpunk Teal)
            if (softSkillsText) {
                summaryHTML += `<br><strong style="color:var(--teal)">Core Competencies:</strong> ${softSkillsText}.`;
            }

            summaryEl.innerHTML = summaryHTML;
        }

        // Profile Image
        const profileImg = document.getElementById('profile-image');
        if (profileImg && cv.basics?.image) {
            const isUrl = cv.basics.image.startsWith('http');
            profileImg.src = isUrl ? cv.basics.image : (assetPath + cv.basics.image);
        }

        // Contact Visibility
        function updateContact(id, value) {
            const el = document.getElementById(id);
            if (!el) return;
            const parentLi = el.closest('li');
            if (value && value.trim() !== "") {
                el.textContent = value;
                if (parentLi) parentLi.style.display = 'flex';
            } else {
                if (parentLi) parentLi.style.display = 'none';
            }
        }
        updateContact('phone', cv.basics?.phone);
        updateContact('email', cv.basics?.email);

        const loc = document.getElementById('location');
        if (loc) {
            const c = cv.basics?.location?.city || '';
            const r = cv.basics?.location?.region || '';
            updateContact('location', c && r ? `${c}, ${r}` : `${c}${r}`);
        }

        const linked = document.getElementById('linkedin');
        if (linked) {
            let l = '';
            if (cv.basics?.profiles?.length) l = cv.basics.profiles[0].url || cv.basics.profiles[0].username || '';
            updateContact('linkedin', l);
        }

        /*
        // --- LANGUAGES ---
        const langList = document.getElementById('languages-list');
        if (langList) {
            langList.innerHTML = '';
            (cv.languages || []).forEach(l => {
                const li = document.createElement('li');
                li.textContent = l.language + (l.fluency ? ` (${l.fluency})` : '');
                langList.appendChild(li);
            });
        }
        */

        // --- SIDEBAR SKILLS ---
        const sidebarSkillsEl = document.getElementById('sidebar-skills');
        if (sidebarSkillsEl) {
            sidebarSkillsEl.innerHTML = '<h3 style="margin-bottom:10px;">Skills</h3>'; // Tighter header

            Object.keys(skillsByGroup).forEach(group => {
                const gDiv = document.createElement('div');
                gDiv.className = 'skill-group';
                gDiv.style.marginBottom = '12px'; // FORCE: Reduce gap between groups (Programming -> Tools)

                const h4 = document.createElement('h4');
                h4.textContent = group;
                h4.style.margin = '0 0 4px 0'; // FORCE: Tighten group header
                h4.style.fontSize = '0.9rem';
                gDiv.appendChild(h4);

                skillsByGroup[group].forEach(skill => {
                    const sDiv = document.createElement('div');
                    sDiv.className = 'skill';
                    sDiv.style.marginBottom = '3px'; // FORCE: Tighten individual skill rows
                    sDiv.style.display = 'flex';
                    sDiv.style.justifyContent = 'space-between';
                    sDiv.style.alignItems = 'center';

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'skill-name';
                    nameSpan.textContent = skill.name;
                    nameSpan.style.fontSize = '0.85rem'; // FORCE: Smaller font
                    sDiv.appendChild(nameSpan);

                    const lvlDiv = document.createElement('div');
                    lvlDiv.className = 'skill-level';
                    // FORCE: Scale dots down to 85% size
                    lvlDiv.style.transform = 'scale(0.85)';
                    lvlDiv.style.transformOrigin = 'right center';

                    const rating = parseRating(skill.level);
                    for (let i = 0; i < 5; i++) {
                        const dot = document.createElement('span');
                        if (i < rating) dot.classList.add('filled');
                        lvlDiv.appendChild(dot);
                    }
                    sDiv.appendChild(lvlDiv);
                    gDiv.appendChild(sDiv);
                });
                sidebarSkillsEl.appendChild(gDiv);
            });
        }

        // --- WORK EXPERIENCE (SPLIT COLUMNS) ---
        const col1 = document.getElementById('work-col-1');
        const col2 = document.getElementById('work-col-2');

        if (col1 && col2 && cv.work) {
            col1.innerHTML = '';
            col2.innerHTML = '';
            const colours = ['c1', 'c2', 'c3', 'c4'];

            // CONFIG: How many items in the first column?
            const splitIndex = 2;

            cv.work.forEach((job, idx) => {
                const card = document.createElement('div');
                card.className = `work-card ${colours[idx % colours.length]}`;

                // Date & Meta
                const st = job.startDate ? job.startDate.split('-')[0] : '';
                const en = job.endDate ? job.endDate.split('-')[0] : '';
                let dS = !en ? 'Present' : (!st ? en : `${st} – ${en}`);

                const metaDiv = document.createElement('div');
                metaDiv.className = 'work-meta';
                metaDiv.style.fontSize = '0.8rem';
                metaDiv.style.color = 'var(--text-secondary)';
                metaDiv.style.marginBottom = '2px';
                metaDiv.innerHTML = `<span style="color:var(--text-primary); font-weight:600;">${dS}</span> &nbsp;|&nbsp; <span class="company-name">${job.name}</span>`;
                card.appendChild(metaDiv);

                const h4 = document.createElement('h4');
                h4.textContent = job.position;
                h4.style.margin = '0 0 6px 0';
                h4.style.fontSize = '0.95rem';
                card.appendChild(h4);

                if (job.highlights && job.highlights.length) {
                    const ul = document.createElement('ul');
                    ul.style.marginTop = '4px';
                    ul.style.marginBottom = '0';
                    job.highlights.forEach(h => {
                        const li = document.createElement('li');
                        li.textContent = h;
                        li.style.marginBottom = '1px';
                        ul.appendChild(li);
                    });
                    card.appendChild(ul);
                }

                // Append to correct column
                if (idx < splitIndex) {
                    col1.appendChild(card);
                } else {
                    col2.appendChild(card);
                }
            });

            // Hide second column container if empty
            if (cv.work.length <= splitIndex) {
                if (col2.parentElement) col2.parentElement.style.display = 'none';
            }
        }

        // --- EDUCATION ---
        const eduSection = document.getElementById('education-section');
        if (eduSection) {
            eduSection.innerHTML = '';
            const headerEdu = document.createElement('h3');
            const eduIconBox = document.createElement('span');
            eduIconBox.className = 'icon-box';
            eduIconBox.innerHTML = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917z"/><path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466z"/></svg>';
            headerEdu.appendChild(eduIconBox);
            headerEdu.insertAdjacentText('beforeend', 'Education');
            eduSection.appendChild(headerEdu);
            const dividerEdu = document.createElement('div');
            dividerEdu.className = 'divider';
            eduSection.appendChild(dividerEdu);

            const eduLogoMap = {
                'paul-valéry university': 'Logo_UMPV_COULEUR.png',
                'paul valéry': 'Logo_UMPV_COULEUR.png',
                'uab university': 'logotipuab-av-acronim-negatiu-verd.png',
                'uab': 'logotipuab-av-acronim-negatiu-verd.png',
                'brunel university': 'brunel_logo.png',
                'brunel': 'brunel_logo.png'
            };

            (cv.education || []).forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'education-item';
                const iconDiv = document.createElement('div');
                iconDiv.className = 'education-icon';
                const inst = (item.institution || '').toLowerCase();
                let logo = null;
                Object.keys(eduLogoMap).forEach(key => {
                    if (inst.includes(key)) logo = eduLogoMap[key];
                });

                if (logo) {
                    iconDiv.innerHTML = `<div style="background:#ffffff;border-radius:50%;width:28px;height:28px;overflow:hidden;display:flex;align-items:center;justify-content:center;"><img src="${assetPath}${logo}" alt="logo" style="width:100%;height:100%;object-fit:contain;" /></div>`;
                } else {
                    iconDiv.innerHTML = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917z"/><path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466z"/></svg>';
                }
                itemDiv.appendChild(iconDiv);

                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'education-details';
                const infoDiv = document.createElement('div');
                infoDiv.className = 'edu-info';
                const titleDiv = document.createElement('div');
                titleDiv.className = 'edu-title';
                titleDiv.textContent = item.area;
                const subtitleDiv = document.createElement('div');
                subtitleDiv.className = 'edu-subtitle';
                subtitleDiv.textContent = item.institution + (item.studyType ? ' · ' + item.studyType : '');
                infoDiv.appendChild(titleDiv);
                infoDiv.appendChild(subtitleDiv);
                const datesDiv = document.createElement('div');
                datesDiv.className = 'edu-dates';
                const sY = item.startDate ? item.startDate.split('-')[0] : '';
                const eY = item.endDate ? item.endDate.split('-')[0] : '';
                datesDiv.textContent = !eY ? 'Current' : (!sY ? eY : `${sY} – ${eY}`);
                detailsDiv.appendChild(infoDiv);
                detailsDiv.appendChild(datesDiv);
                itemDiv.appendChild(detailsDiv);
                eduSection.appendChild(itemDiv);
            });
        }

        // --- ONLINE COURSES / CERTIFICATES (MOVED TO SIDEBAR) ---
        const certsContainer = document.getElementById('sidebar-certs');
        const certsData = cv.certificates || cv.courses || [];

        if (certsContainer && certsData.length > 0) {
            certsContainer.style.display = 'block';

            // FORCE: Override any CSS margins
            certsContainer.style.marginTop = '15px';
            certsContainer.innerHTML = '';

            const header = document.createElement('h3');
            header.textContent = 'Certificates';
            header.style.marginBottom = '8px'; // Tight header
            certsContainer.appendChild(header);

            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';
            ul.style.padding = '0';
            ul.style.margin = '0'; // Remove default UL margin

            certsData.forEach(c => {
                const li = document.createElement('li');
                li.style.marginBottom = '8px'; // Tight rows
                li.style.lineHeight = '1.2';

                const title = document.createElement('div');
                title.style.color = 'var(--text-primary)';
                title.style.fontWeight = '500';
                title.style.fontSize = '0.85rem';
                title.textContent = c.name;
                li.appendChild(title);

                const meta = document.createElement('div');
                meta.style.color = 'var(--text-secondary)';
                meta.style.fontSize = '0.75rem';
                meta.style.marginTop = '1px';

                let metaText = c.issuer || '';
                if (c.date) {
                    const year = c.date.split('-')[0];
                    metaText += metaText ? ` · ${year}` : year;
                }
                meta.textContent = metaText;
                li.appendChild(meta);

                ul.appendChild(li);
            });
            certsContainer.appendChild(ul);
        }
    } catch (err) {
        console.error('Error loading CV data:', err);
    }
});