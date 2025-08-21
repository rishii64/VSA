document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const modules = document.querySelectorAll('.module');
    const moduleContents = document.querySelectorAll('.module-content');
    const nextBtn = document.querySelector('.next-btn');
    const currentModuleDisplay = document.querySelector('.current-module');
    const hideSidebarBtn = document.querySelector('.hide-sidebar');
    const showSidebarBtn = document.querySelector('.show-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const submitQuizBtns = document.querySelectorAll('.submit-quiz');
    const videoPlaceholders = document.querySelectorAll('.video-placeholder');
    const videoPlayers = document.querySelectorAll('.video-player');
    const correctAudio = new Audio('./correct.mp3');
    const wrongAudio = new Audio('./incorrect.mp3');
    correctAudio.preload = 'auto';
    wrongAudio.preload = 'auto';

    // Track current module index
    let currentModuleIndex = 0;
    const totalModules = modules.length;
    const completedModules = new Set();

    // Initialize the module
    function initModule() {
        updateActiveModule();
        updateNextButton();
        checkMobileView();

        // Check if initial module is a quiz
        if (modules[currentModuleIndex].dataset.module.startsWith('quiz')) {
            setupQuizPreview(modules[currentModuleIndex].dataset.module);
        }
    }

    // Update active module in sidebar and content
    function updateActiveModule() {
        // Update sidebar
        modules.forEach((module, index) => {
            module.classList.toggle('active', index === currentModuleIndex);
        });

        // Update content with fade animation
        moduleContents.forEach((content, index) => {
            if (index === currentModuleIndex) {
                content.classList.add('active');

                // 🔄 Restart animation
                content.classList.remove('fade-in'); // remove if exists
                void content.offsetWidth;            // force reflow
                content.classList.add('fade-in');    // re-add
            } else {
                content.classList.remove('active', 'fade-in');
            }
        });

        // Update current module display
        const activeModule = modules[currentModuleIndex];
        currentModuleDisplay.textContent = activeModule.querySelector('span').textContent;

        const moduleId = activeModule.dataset.module;
        const isQuiz = moduleId.startsWith('quiz');

        if (isQuiz && !completedModules.has(currentModuleIndex)) {
            nextBtn.disabled = true;
        } else if (!isQuiz) {
            // Check if this module contains a video
            const video = document.querySelector(`#${moduleId} .video-player`);
            if (video) {
                nextBtn.disabled = true;

                // Enable next only when video ends
                const enableNext = () => {
                    nextBtn.disabled = false;
                    video.removeEventListener('ended', enableNext); // clean up
                };

                // In case the user has already watched the video before
                if (video.ended) {
                    nextBtn.disabled = false;
                } else {
                    video.addEventListener('ended', enableNext);
                }
            } else {
                nextBtn.disabled = currentModuleIndex === totalModules - 1;
            }
        }

    }

    // Update next button state
    function updateNextButton() {
        const currentIndex = currentModuleIndex;
        nextBtn.disabled = currentIndex >= modules.length - 1;
    }

    // Mark module as completed
    function markModuleCompleted(index) {
        modules[index].classList.add('completed');
        completedModules.add(index);
    }

    // Move to next module
    function goToNextModule() {
        if (currentModuleIndex < totalModules - 1) {
            markModuleCompleted(currentModuleIndex);
            currentModuleIndex++;
            updateActiveModule();
            updateNextButton();
            scrollToTop();

            nextBtn.disabled = true //disabling NXT button for every module start

            // Check if new module is a quiz
            const newModule = modules[currentModuleIndex];
            if (newModule.dataset.module.startsWith('quiz')) {
                const quizId = newModule.dataset.module;
                requestAnimationFrame(() => {   // Wait for DOM to render updated module content
                    setTimeout(() => {
                        setupQuizPreview(quizId);
                    }, 50); // gives the DOM enough time to paint
                });
            }
        }
    }

    // Scroll to top of content area
    function scrollToTop() {
        document.querySelector('.content-area').scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Check if mobile view and hide sidebar
    function checkMobileView() {
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('show');
        }
    }

    // Function to stop all playing videos
    function stopAllVideos() {
        videoPlayers.forEach(player => {
            player.pause();
            player.currentTime = 0;
            // Show the placeholder again
            const placeholder = player.previousElementSibling;
            if (placeholder.classList.contains('video-placeholder')) {
                placeholder.style.display = 'flex';
                player.style.display = 'none';
            }
        });
    }

    // Event Listeners
    nextBtn.addEventListener('click', function () {
        goToNextModule();  // Next button click
        stopAllVideos();
    })

    // Handle quiz preview screens with audio
    function setupQuizPreview(quizId) {
        const preview = document.querySelector(`#${quizId} .quiz-preview`);
        const quizContainer = document.querySelector(`#${quizId} .quiz-container`);
        const countdownElement = preview.querySelector('.countdown');

        // Ensure quiz container is hidden when preview starts
        quizContainer.style.display = 'none';
        preview.style.display = 'flex';

        let count = 5;
        countdownElement.textContent = `Starting in ${count}...`;

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownElement.textContent = `Starting in ${count}...`;
            } else {
                clearInterval(timer);
                preview.style.display = 'none';
                quizContainer.style.display = 'block';

                // Play audio for the first question
                const firstQuestion = quizContainer.querySelector('.question[data-question-index="0"]');
                if (firstQuestion) {
                    const audioSrc = firstQuestion.dataset.audio;
                    if (audioSrc) {
                        const firstAudio = new Audio(audioSrc);
                        firstAudio.play().catch(err => console.warn('Audio play failed:', err));
                    }
                }
            }
        }, 1000);
    }

    // Module click in sidebar
    modules.forEach((module, index) => {
        module.addEventListener('click', function () {
            stopAllVideos();    // Stop any playing videos when switching modules
            currentModuleIndex = index;
            updateActiveModule();
            scrollToTop();

            const moduleId = this.dataset.module;
            if (moduleId.startsWith('quiz')) {
                setupQuizPreview(moduleId);
            }

            // Hide sidebar on mobile after selection
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('show');
            }
        });
    });

    // Quiz answers (for demo purposes)
    const quizAnswers = {
        'quiz1-q1': 'b',
        'quiz1-q2': 'b',
        'quiz1-q3': 'd',
        'quiz1-q4': 'a',
        'quiz1-q5': 'a',
        'quiz1-q6': 'c',
        'quiz2-q7': 'a',
        'quiz2-q8': 'c',
        'quiz2-q9': 'a',
        'quiz2-q10': 'b',
    };

    // Submit quiz buttons
    submitQuizBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const questionBlock = this.closest('.question_box');
            const input = questionBlock.querySelector('input[type="radio"]:checked');
            const questionId = input?.name;

            // Remove previous feedback
            const existingFeedback = questionBlock.querySelector('.quiz-feedback');
            if (existingFeedback) existingFeedback.remove();

            const feedback = document.createElement('div');
            feedback.classList.add('quiz-feedback');

            if (!input) {
                feedback.classList.add('incorrect');
                feedback.textContent = 'Please select an answer before submitting.';
                this.insertAdjacentElement('afterend', feedback);
                feedback.style.display = 'block';
                return;
            }

            const isCorrect = input.value === quizAnswers[questionId];
            input.closest('.option').classList.add('selected');

            if (isCorrect) {
                input.closest('.option').classList.add('correct');
                feedback.classList.add('correct');
                feedback.textContent = 'Correct! Well Done 👍🎉';
                correctAudio.play().catch(e => console.warn('Correct audio failed:', e));
            } else {
                input.closest('.option').classList.add('incorrect');
                feedback.classList.add('incorrect');
                feedback.innerHTML = 'Incorrect! 👎 Watch the video or try again.';
                wrongAudio.play().catch(e => console.warn('Wrong audio failed:', e));
                this.insertAdjacentElement('afterend', feedback);
                feedback.style.display = 'block';

                setTimeout(() => {      // switching to previous module when answered wrong
                    const prevIndex = currentModuleIndex - 1;
                    if (prevIndex >= 0) {
                        currentModuleIndex = prevIndex;
                        updateActiveModule();
                        scrollToTop();

                        // Reseting quiz progress
                        const quizContainer = questionBlock.closest('.quiz-container');
                        quizContainer.querySelectorAll('.question_box').forEach((qBox, idx) => {
                            qBox.style.display = idx === 0 ? 'flex' : 'none';
                            qBox.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
                            qBox.querySelectorAll('.option').forEach(o => o.classList.remove('selected', 'correct', 'incorrect'));
                            const fb = qBox.querySelector('.quiz-feedback');
                            if (fb) fb.remove();
                        });
                    }
                }, 4000);
                return;
            }
            this.insertAdjacentElement('afterend', feedback);
            feedback.style.display = 'block';

            // Move to next question after a brief delay
            const container = questionBlock.closest('.quiz-container');
            const currentIndex = parseInt(questionBlock.dataset.questionIndex);
            const nextBox = container.querySelector(`.question_box[data-question-index="${currentIndex + 1}"]`);

            setTimeout(() => {
                // hiding entire current question (image + text)
                questionBlock.style.display = 'none';
                if (nextBox) {
                    nextBox.style.display = 'flex';  // show full next question_box (flex layout)
                    const nextQuestion = nextBox.querySelector('.question');
                    const audioSrc = nextQuestion?.dataset.audio;   // ✅ Play question-specific audio
                    if (audioSrc) {
                        const questionAudio = new Audio(audioSrc);
                        questionAudio.play().catch(err => console.warn('Audio play failed:', err));
                    }
                } else {
                    const currentModule = document.querySelector('.module.active');     // ✅ Last question of this quiz
                    currentModule.classList.add('completed');

                    // Hide the quiz container
                    const quizContainer = questionBlock.closest('.quiz-container');
                    quizContainer.style.display = 'none';

                    // Show the quiz-completion screen
                    const completionScreen = quizContainer.parentElement.querySelector('.quiz-completion');
                    if (completionScreen) {
                        completionScreen.style.display = 'flex';
                        createConfetti(completionScreen);   // 🎉 Triggering confetti here
                        nextBtn.disabled = false;
                    }
                }
            }, 3000);
        });
    });

    // Video placeholders
    videoPlaceholders.forEach(video => {
        video.addEventListener('click', function () {
            this.style.display = 'none';     // Hide the placeholder

            // Show and play the corresponding video player
            const videoPlayer = this.nextElementSibling;
            videoPlayer.style.display = 'block';

            // Request fullscreen when playing
            if (videoPlayer.requestFullscreen) {
                videoPlayer.requestFullscreen().catch(e => {
                    console.log("Fullscreen error:", e);
                });
            }

            videoPlayers.forEach(video => {
                video.addEventListener('contextmenu', e => e.preventDefault());   // prevent right-click control
                video.addEventListener('keydown', e => {    // preventing using keyboard shortcuts to skip video
                    if (['<', '>', '+', '-', '=', '_'].includes(e.key)) e.preventDefault();
                });
            });

            videoPlayer.play();

            // When video ends, show the placeholder again
            videoPlayer.addEventListener('ended', function () {
                // Exit fullscreen if we're in it
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(e => {
                        console.log("Exit fullscreen error:", e);
                    });
                }
                video.style.display = 'flex';
                this.style.display = 'none';
            });
        });
    });

    // Sidebar toggle buttons
    hideSidebarBtn.addEventListener('click', function () {
        sidebar.classList.remove('show');
    });

    showSidebarBtn.addEventListener('click', function () {
        sidebar.classList.add('show');
    });

    // Window resize event
    window.addEventListener('resize', checkMobileView);

    // Initialize the module
    initModule();

    // Add hamburger menu event listener
    hamburgerMenu.addEventListener('click', function () {
        sidebar.classList.toggle('show');
    });

    // Update the checkMobileView function
    function checkMobileView() {
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('show');
            hamburgerMenu.style.display = 'block';
        } else {
            sidebar.classList.add('show');
            hamburgerMenu.style.display = 'none';
        }
    }

    // Create confetti effect
    function createConfetti(container) {
        const colors = ['#6C63FF', '#FF6584', '#4FD1C5', '#F6E05E', '#FC8181'];

        for (let i = 0; i < 80; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

            const size = Math.random() * 8 + 4;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';

            container.appendChild(confetti);

            const animation = confetti.animate([
                { top: '-10px', opacity: 1, transform: `rotate(0deg)` },
                { top: '90%', opacity: 0, transform: `rotate(${Math.random() * 360}deg)` }
            ], {
                duration: Math.random() * 3000 + 2000,
                delay: Math.random() * 500,
                easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
            });
            animation.onfinish = () => confetti.remove();
        }
    }
});