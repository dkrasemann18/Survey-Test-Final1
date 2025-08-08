// script.js – handles survey flow and prompt recommendation logic

document.addEventListener('DOMContentLoaded', async () => {
    const steps = document.querySelectorAll('.step');
    const progress = document.getElementById('progress');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const form = document.getElementById('survey-form');
    let currentStep = 0;
    let promptsData = [];

    // Cover page elements and initial UI setup
    const coverPage = document.getElementById('cover-page');
    const startBtn = document.getElementById('startBtn');
    const progressBarEl = document.querySelector('.progress-bar');
    const navigationEl = document.querySelector('.navigation');

    if (progressBarEl) progressBarEl.style.display = 'none';
    if (navigationEl) navigationEl.style.display = 'none';

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (coverPage) coverPage.style.display = 'none';
            form.style.display = 'block';
            if (progressBarEl) progressBarEl.style.display = 'block';
            if (navigationEl) navigationEl.style.display = 'flex';
            currentStep = 0;
            showStep(currentStep);
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function normalizeTask(task) {
        if (!task) return task;
        if (task.trim().toLowerCase().startsWith('brainstorm')) {
            return 'Brainstorm';
        }
        if (task.trim().toLowerCase().startsWith('drafting')) {
            return 'Drafting & Writing';
        }
        return task;
    }

    function showStep(index) {
        steps.forEach((step, i) => {
            step.style.display = i === index ? 'block' : 'none';
        });
        const totalSteps = steps.length - 1;
        const ratio = index / totalSteps;
        progress.style.width = `${Math.min(ratio * 100, 100)}%`;

        prevBtn.style.display = index === 0 ? 'none' : 'inline-block';

        if (index === steps.length - 1) {
            document.querySelector('.navigation').style.display = 'none';
        } else {
            document.querySelector('.navigation').style.display = 'flex';
            nextBtn.textContent = index === steps.length - 2 ? 'Submit' : 'Next';
        }
    }

    function processForm() {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const name = formData.get('name');
        const email = formData.get('email');
        const level = formData.get('level');
        const offering = formData.get('offering');
        const offerings = offering ? [offering] : [];
        const tasks = formData.getAll('tasks');
        const familiarity = formData.get('familiarity');
        const favorites = formData.get('favorites');
        const promptLevel = familiarity; // Direct match to "Prompt Level"
        const mappedTasks = tasks.map(normalizeTask);

        if (favorites && favorites.trim() !== '') {
            const subject = encodeURIComponent('Favorite Gen AI Prompts Submission');
            const body = encodeURIComponent(
                'Level: ' + (level || '') + '\n' +
                'AI Familiarity: ' + (familiarity || '') + '\n' +
                'Selected Tasks: ' + tasks.join(', ') + '\n' +
                'Favorite Prompts: ' + favorites.trim()
            );
            const mailtoUrl = 'mailto:dkrasemann@deloitte.com?subject=' + subject + '&body=' + body;
            window.location.href = mailtoUrl;
        }

        const filtered = promptsData.filter(item => {
            if (!offerings.includes(item['S&T Offering'])) return false;
            if (!mappedTasks.includes(item['Task Category'])) return false;
            if (item['Prompt Level'] !== promptLevel) return false;
            if (item['Recommended Level'] !== level) return false;
            return true;
        });

        const grouped = {};
        filtered.forEach(item => {
            const category = item['Task Category'];
            if (!grouped[category]) {
                grouped[category] = new Set();
            }
            grouped[category].add(item['Prompt']);
        });

        const resultsContainer = document.getElementById('results-container');
        resultsContainer.innerHTML = '';

        const userInfo = document.createElement('div');
        userInfo.classList.add('user-info');
        userInfo.innerHTML = `
            <p><strong>Name:</strong> ${name || ''}</p>
            <p><strong>Email:</strong> ${email || ''}</p>
            <p><strong>S&amp;T Offering:</strong> ${offering || ''}</p>
            <p><strong>Level:</strong> ${level || ''}</p>
            <p><strong>AI Familiarity:</strong> ${familiarity || ''}</p>
            <p><strong>Tasks:</strong> ${tasks.join(', ') || ''}</p>
        `;
        resultsContainer.appendChild(userInfo);

        const summary = document.createElement('p');
        summary.classList.add('summary');
        summary.textContent = `Respondents who are at ${level} Level from ${offering} Offering benefit from the following prompts:`;
        resultsContainer.appendChild(summary);

        if (Object.keys(grouped).length === 0) {
            const noPromptsMsg = document.createElement('p');
            noPromptsMsg.textContent = 'No prompts matched your selections. Try broadening your options.';
            resultsContainer.appendChild(noPromptsMsg);
        } else {
            const sortedCategories = Object.keys(grouped).sort();
            sortedCategories.forEach(category => {
                const header = document.createElement('h3');
                header.textContent = category;
                resultsContainer.appendChild(header);
                const ul = document.createElement('ul');
                const promptArray = Array.from(grouped[category]).sort();
                promptArray.forEach(promptText => {
                    const li = document.createElement('li');
                    li.textContent = promptText;
                    ul.appendChild(li);
                });
                resultsContainer.appendChild(ul);
            });
        }

        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.onclick = () => {
            let bodyHtml = '';
            bodyHtml += `<p><strong>Name:</strong> ${name || ''}</p>`;
            bodyHtml += `<p><strong>Email:</strong> ${email || ''}</p>`;
            bodyHtml += `<p><strong>S&amp;T Offering:</strong> ${offering || ''}</p>`;
            bodyHtml += `<p><strong>Level:</strong> ${level || ''}</p>`;
            bodyHtml += `<p><strong>AI Familiarity:</strong> ${familiarity || ''}</p>`;
            bodyHtml += `<p><strong>Tasks:</strong> ${tasks.join(', ') || ''}</p>`;
            bodyHtml += `<p>Respondents who are at ${level} Level from ${offering} Offering benefit from the following prompts:</p>`;
            if (Object.keys(grouped).length === 0) {
                bodyHtml += `<p>No prompts matched your selections.</p>`;
            } else {
                Object.keys(grouped).sort().forEach(category => {
                    bodyHtml += `<h3>${category}</h3>`;
                    bodyHtml += '<ul>';
                    Array.from(grouped[category]).sort().forEach(promptText => {
                        bodyHtml += `<li>${escapeHtml(promptText)}</li>`;
                    });
                    bodyHtml += '</ul>';
                });
            }

            const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
                "xmlns:w='urn:schemas-microsoft-com:office:word' " +
                "xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Recommended Prompts</title></head><body>";
            const postHtml = "</body></html>";
            const html = preHtml + bodyHtml + postHtml;
            const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'recommended_prompts.doc';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        currentStep = steps.length - 1;
        showStep(currentStep);
    }

    nextBtn.addEventListener('click', () => {
        if (currentStep === steps.length - 2) {
            processForm();
        } else {
            const currentFields =
                steps[currentStep].querySelectorAll('input[required], textarea[required]');
            let valid = true;
            currentFields.forEach(field => {
                if (!field.checkValidity()) {
                    valid = false;
                }
            });
            if (!valid) {
                currentFields[0].reportValidity();
                return;
            }
            currentStep++;
            showStep(currentStep);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    });

    try {
        const response = await fetch('prompts.json');
        promptsData = await response.json();
    } catch (err) {
        console.error('Error loading prompts:', err);
        promptsData = [];
    }

    showStep(currentStep);
});
