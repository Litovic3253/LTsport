// Конфигурация
const exercises = [
    'Жим штанги лежа',
    'Приседания со штангой',
    'Становая тяга',
    'Тяга верхнего блока',
    'Жим гантелей сидя',
    'Выпады со штангой',
    'Подтягивания',
    'Отжимания на брусьях'
];

// Инициализация хранилища
let trainingData = JSON.parse(localStorage.getItem('trainingData')) || [];
let currentTheme = localStorage.getItem('theme') || 'light';

// Сохранение данных
function saveData() {
    localStorage.setItem('trainingData', JSON.stringify(trainingData));
}

// Управление темами
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
}

// Управление модальным окном
function showBestResults() {
    const bestResults = exercises.reduce((acc, exercise) => {
        const allResults = trainingData.flatMap(day => 
            day.exercises
                .filter(ex => ex.name === exercise)
                .map(ex => ({ weight: Number(ex.weight), reps: Number(ex.reps) }))
        );
        
        const maxWeight = allResults.reduce((max, curr) => 
            curr.weight > max ? curr.weight : max, 0);
            
        const maxReps = allResults.reduce((max, curr) => 
            curr.reps > max ? curr.reps : max, 0);
        
        if (maxWeight > 0 || maxReps > 0) {
            acc[exercise] = { maxWeight, maxReps };
        }
        return acc;
    }, {});

    const resultsHTML = Object.entries(bestResults)
        .map(([name, results]) => `
            <div class="best-result-item">
                <h4>${name}</h4>
                <p>Макс. вес: ${results.maxWeight} кг</p>
                <p>Макс. повторения: ${results.maxReps}</p>
            </div>
        `).join('');

    document.getElementById('best-results').innerHTML = resultsHTML || '<p>Нет данных</p>';
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Сворачивание/разворачивание дней
function toggleDayVisibility(event) {
    const dayCard = event.currentTarget.closest('.day-card');
    dayCard.classList.toggle('collapsed');
    const dayIndex = Array.from(dayCard.parentElement.children).indexOf(dayCard);
    trainingData[dayIndex].collapsed = dayCard.classList.contains('collapsed');
    saveData();
}

// Создание элемента упражнения
function createExerciseElement(dayIndex, exerciseIndex, exercise) {
    const form = document.createElement('form');
    form.className = 'exercise-form';
    
    // Выбор упражнения
    const select = document.createElement('select');
    select.className = 'exercise-select';
    exercises.forEach(ex => {
        const option = document.createElement('option');
        option.value = ex;
        option.textContent = ex;
        option.selected = ex === exercise.name;
        select.appendChild(option);
    });
    
    // Поле веса
    const weightInput = document.createElement('input');
    weightInput.type = 'number';
    weightInput.className = 'exercise-input';
    weightInput.placeholder = 'Вес (кг)';
    weightInput.value = exercise.weight;
    
    // Поле повторений
    const repsInput = document.createElement('input');
    repsInput.type = 'number';
    repsInput.className = 'exercise-input';
    repsInput.placeholder = 'Повторения';
    repsInput.value = exercise.reps;
    
    // Кнопка удаления
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-exercise-btn';
    deleteBtn.textContent = '×';
    
    // Обработчики событий
    const updateHandler = () => {
        trainingData[dayIndex].exercises[exerciseIndex] = {
            name: select.value,
            weight: weightInput.value,
            reps: repsInput.value
        };
        saveData();
    };

    select.addEventListener('change', updateHandler);
    weightInput.addEventListener('input', updateHandler);
    repsInput.addEventListener('input', updateHandler);
    
    deleteBtn.addEventListener('click', () => {
        trainingData[dayIndex].exercises.splice(exerciseIndex, 1);
        saveData();
        renderDays();
    });
    
    form.append(select, weightInput, repsInput, deleteBtn);
    return form;
}

// Создание карточки дня
function createDayElement(day, index) {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    if (day.collapsed) {
        dayCard.classList.add('collapsed');
    }
    
    // Шапка дня
    const header = document.createElement('div');
    header.className = 'day-header';
    header.addEventListener('click', toggleDayVisibility);
    
    const headerContent = document.createElement('div');
    headerContent.style.display = 'flex';
    headerContent.style.alignItems = 'center';
    headerContent.style.gap = '10px';
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-day-btn';
    toggleBtn.textContent = '▼';
    
    const date = document.createElement('span');
    date.className = 'day-date';
    date.textContent = new Date(day.date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-day-btn';
    deleteBtn.textContent = '×';
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        trainingData.splice(index, 1);
        saveData();
        renderDays();
    });
    
    headerContent.append(toggleBtn, date);
    header.append(headerContent, deleteBtn);
    
    // Контейнер упражнений
    const exercisesContainer = document.createElement('div');
    exercisesContainer.className = 'exercises-container';
    day.exercises.forEach((exercise, exerciseIndex) => {
        exercisesContainer.appendChild(
            createExerciseElement(index, exerciseIndex, exercise)
        );
    });
    
    // Кнопка добавления упражнения
    const addExerciseBtn = document.createElement('button');
    addExerciseBtn.className = 'add-exercise-btn';
    addExerciseBtn.textContent = '+ Добавить упражнение';
    
    addExerciseBtn.addEventListener('click', () => {
        trainingData[index].exercises.push({
            name: exercises[0],
            weight: '',
            reps: ''
        });
        saveData();
        renderDays();
    });
    
    dayCard.append(header, exercisesContainer, addExerciseBtn);
    return dayCard;
}

// Отрисовка всех дней
function renderDays() {
    const container = document.getElementById('days-container');
    container.innerHTML = '';
    
    trainingData.forEach((day, index) => {
        container.appendChild(createDayElement(day, index));
    });
}

// Инициализация
document.querySelector('.add-day-btn').addEventListener('click', () => {
    trainingData.push({
        date: new Date().toISOString(),
        exercises: [],
        collapsed: false
    });
    saveData();
    renderDays();
});

document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
document.querySelector('.best-results-btn').addEventListener('click', showBestResults);
document.querySelector('.close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal')) closeModal();
});

// Установить начальную тему
document.documentElement.setAttribute('data-theme', currentTheme);

// Первоначальная загрузка
renderDays();
