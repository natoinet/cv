window.addEventListener('DOMContentLoaded', async function () {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const usePrivate = urlParams.has('private');

        let cv;

        if (usePrivate) {
            try {
                // Try to fetch the local private file
                const response = await fetch('cv.private.json');
                if (!response.ok) throw new Error("Private file not found");
                cv = await response.json();
                console.log("🔒 Loaded PRIVATE Data");
            } catch (e) {
                // Fallback if private file is missing (e.g. on live site)
                console.warn("Could not load private data, falling back to public.");
                const response = await fetch('cv.json');
                cv = await response.json();
            }
        } else {
            // Default to public
            const response = await fetch('cv.json');
            cv = await response.json();
            console.log("🌍 Loaded PUBLIC Data");
        }

        // 1. ASSET CONFIG: Grab asset path (defaults to empty string if undefined)
        const assetPath = window.ASSET_PATH || '';

        function parseRating(level) {
            if (!level) return 0;
            if (typeof level === 'string' && level.indexOf('/') !== -1) {
                return parseInt(level.split('/')[0], 10);
            }
            return parseInt(level, 10) || 0;
        }

        // --- BASIC INFO ---
        const nameEl = document.getElementById('sidebar-name');
        if (nameEl) nameEl.textContent = cv.basics?.name?.toUpperCase() || '';
        const profileImg = document.getElementById('profile-image');
        if (profileImg && cv.basics?.image) {
            const isUrl = cv.basics.image.startsWith('http');
            profileImg.src = isUrl ? cv.basics.image : (assetPath + cv.basics.image);
        }
        const jobWideEl = document.getElementById('job-title-wide');
        if (jobWideEl) jobWideEl.textContent = cv.basics?.label || '';
        const summaryEl = document.querySelector('.card.profile p');
        if (summaryEl) summaryEl.textContent = cv.basics?.summary || '';

        // Contact
        // Helper to update text OR hide the entire list item if empty
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

        // Apply to contact fields
        updateContact('phone', cv.basics?.phone);
        updateContact('email', cv.basics?.email);

        const locationEl = document.getElementById('location');
        if (locationEl) {
            const city = cv.basics?.location?.city || '';
            const region = cv.basics?.location?.region || '';
            const locStr = city && region ? `${city}, ${region}` : `${city}${region}`;
            updateContact('location', locStr);
        }

        const linkedinEl = document.getElementById('linkedin');
        if (linkedinEl) {
            let link = '';
            if (cv.basics?.profiles?.length) {
                const p = cv.basics.profiles[0];
                link = p.url || p.username || '';
            }
            updateContact('linkedin', link);
        }

        // --- LANGUAGES ---
        const langList = document.getElementById('languages-list');
        if (langList) {
            langList.innerHTML = '';
            (cv.languages || []).forEach(lang => {
                const li = document.createElement('li');
                let text = lang.language || '';
                if (lang.fluency) text += ' (' + lang.fluency + ')';
                li.textContent = text;
                langList.appendChild(li);
            });
        }

        // --- SKILLS ---
        const skillsByGroup = {};
        (cv.skills || []).forEach(skill => {
            const g = (skill.keywords && skill.keywords.length) ? skill.keywords[0] : 'Other';
            if (!skillsByGroup[g]) skillsByGroup[g] = [];
            skillsByGroup[g].push(skill);
        });

        // Sidebar Skills
        const sidebarSkillsEl = document.getElementById('sidebar-skills');
        if (sidebarSkillsEl) {
            sidebarSkillsEl.innerHTML = '<h3>Skills</h3>';
            Object.keys(skillsByGroup).forEach(group => {
                const gDiv = document.createElement('div');
                gDiv.className = 'skill-group';
                const h4 = document.createElement('h4');
                h4.textContent = group;
                gDiv.appendChild(h4);
                skillsByGroup[group].forEach(skill => {
                    const sDiv = document.createElement('div');
                    sDiv.className = 'skill';
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'skill-name';
                    nameSpan.textContent = skill.name;
                    sDiv.appendChild(nameSpan);
                    const lvlDiv = document.createElement('div');
                    lvlDiv.className = 'skill-level';
                    const rating = parseRating(skill.level);
                    for (let i = 0; i < 5; i++) {
                        const dot = document.createElement('span');
                        if (i < rating) dot.classList.add('filled');
                        lvlDiv.appendChild(dot);
                    }
                    const ratingSpan = document.createElement('span');
                    ratingSpan.className = 'rating-score';
                    ratingSpan.textContent = skill.level;
                    lvlDiv.appendChild(ratingSpan);
                    sDiv.appendChild(lvlDiv);
                    gDiv.appendChild(sDiv);
                });
                sidebarSkillsEl.appendChild(gDiv);
            });
        }

        // Main Skills Section
        const skillsSection = document.getElementById('skills-main-section');
        if (skillsSection) {
            skillsSection.innerHTML = '';
            const header = document.createElement('h3');
            const iconBox = document.createElement('span');
            iconBox.className = 'icon-box';
            iconBox.innerHTML = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M.102 2.223A3.004 3.004 0 0 0 3.78 5.897l6.341 6.252A3.003 3.003 0 0 0 13 16a3 3 0 1 0-.851-5.878L5.897 3.781A3.004 3.004 0 0 0 2.223.1l2.141 2.142L4 4l-1.757.364zm13.37 9.019.528.026.287.445.445.287.026.529L15 13l-.242.471-.026.529-.445.287-.287.445-.529.026L13 15l-.471-.242-.529-.026-.287-.445-.445-.287-.026-.529L11 13l.242-.471.026-.529.445-.287.287-.445.529-.026L13 11z"/></svg>';
            header.appendChild(iconBox);
            header.insertAdjacentText('beforeend', 'Skills & Mords');
            skillsSection.appendChild(header);
            const divider = document.createElement('div');
            divider.className = 'divider';
            skillsSection.appendChild(divider);
            Object.keys(skillsByGroup).forEach(group => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'skill-group';
                const h4 = document.createElement('h4');
                h4.textContent = group;
                groupDiv.appendChild(h4);
                skillsByGroup[group].forEach(skill => {
                    const sDiv = document.createElement('div');
                    sDiv.className = 'skill';
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'skill-name';
                    nameSpan.textContent = skill.name;
                    sDiv.appendChild(nameSpan);
                    const ratingDiv = document.createElement('div');
                    ratingDiv.className = 'skill-rating';
                    const rating = parseRating(skill.level);
                    for (let i = 0; i < 5; i++) {
                        const dotSpan = document.createElement('span');
                        dotSpan.className = 'dot';
                        if (i < rating) dotSpan.classList.add('filled');
                        ratingDiv.appendChild(dotSpan);
                    }
                    const ratingScore = document.createElement('span');
                    ratingScore.className = 'rating-score';
                    ratingScore.textContent = skill.level;
                    ratingDiv.appendChild(ratingScore);
                    sDiv.appendChild(ratingDiv);
                    groupDiv.appendChild(sDiv);
                });
                skillsSection.appendChild(groupDiv);
            });
        }

        // --- EDUCATION (Keeps Logos & Asset Path) ---
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
                    if (inst.includes(key)) {
                        logo = eduLogoMap[key];
                    }
                });

                // Uses ASSET_PATH for Education logos
                if (logo) {
                    iconDiv.innerHTML =
                        '<div style="background:#ffffff;border-radius:50%;width:28px;height:28px;overflow:hidden;display:flex;align-items:center;justify-content:center;">' +
                        '<img src="' + assetPath + logo + '" alt="logo" style="width:100%;height:100%;object-fit:contain;" />' +
                        '</div>';
                } else {
                    iconDiv.innerHTML =
                        '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917z"/><path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466z"/></svg>';
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
                const sYear = item.startDate ? item.startDate.split('-')[0] : '';
                const eYear = item.endDate ? item.endDate.split('-')[0] : '';
                let dateStr = '';
                if (!eYear) dateStr = 'Current';
                else if (!sYear) dateStr = eYear;
                else dateStr = `${sYear} – ${eYear}`;
                datesDiv.textContent = dateStr;
                detailsDiv.appendChild(infoDiv);
                detailsDiv.appendChild(datesDiv);
                itemDiv.appendChild(detailsDiv);
                eduSection.appendChild(itemDiv);
            });
        }

        // --- TIMELINE (WORK EXPERIENCE) ---
        // Logos removed as requested. Pure text layout.
        const timelineEl = document.getElementById('work-cards');
        if (timelineEl) {
            timelineEl.innerHTML = '';
            const colours = ['c1', 'c2', 'c3', 'c4'];
            (cv.work || []).forEach((job, idx) => {
                const card = document.createElement('div');
                card.className = `work-card ${colours[idx % colours.length]}`;

                const h4 = document.createElement('h4');
                h4.textContent = job.position;
                card.appendChild(h4);

                const cDiv = document.createElement('div');
                cDiv.className = 'company-name';
                cDiv.textContent = job.name; // Just text, no logos
                card.appendChild(cDiv);

                const dateDiv = document.createElement('div');
                dateDiv.className = 'work-dates';
                const st = job.startDate ? job.startDate.split('-')[0] : '';
                const en = job.endDate ? job.endDate.split('-')[0] : '';
                let dS = '';
                if (!en) dS = 'Present'; else if (!st) dS = en; else dS = `${st} – ${en}`;
                dateDiv.textContent = dS;
                card.appendChild(dateDiv);

                if (job.highlights && job.highlights.length) {
                    const ul = document.createElement('ul');
                    job.highlights.forEach(h => {
                        const li = document.createElement('li');
                        li.textContent = h;
                        ul.appendChild(li);
                    });
                    card.appendChild(ul);
                }
                timelineEl.appendChild(card);
            });
        }
    } catch (err) {
        console.error('Error loading CV data:', err);
    }
});