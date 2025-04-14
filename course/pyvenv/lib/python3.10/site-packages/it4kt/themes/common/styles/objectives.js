class Objective {
    constructor(element, number) {
        this.element = element;
        this.id = element.id;
        this.number = number.toString();
        this.title = element.textContent.trim();
        this.steps = [];
    }
}

class Step {
    constructor(element) {
        this.element = element;
        this.id = element.id;
        this.number = element.querySelector('.step__number').textContent;
        this.title = element.querySelector('.step__header').textContent.trim();
        this.objectives = [];
    }
}

class ObjectivesRegistry {
    constructor() {
        this.objectives = [];
        this.steps = [];
        this._collectObjectives();
        this._collectSteps();
        this._interconnect();
    }

    getObjective(id) {
        for (const objective of this.objectives) {
            if (objective.id === id)
                return objective;
        }
        return null;
    }


    _collectObjectives() {
        document.querySelectorAll('.objective'). forEach((element, i) => {
            this.objectives.push(new Objective(element, i + 1));
        });
    }

    _collectSteps() {
        document.querySelectorAll('.step').forEach((element) => {
            this.steps.push(new Step(element));
        });
    }

    _interconnect() {
        for (const step of this.steps) {
            if (!('objectives' in step.element.dataset))
                continue;
            const objectiveIds = step.element.dataset.objectives;
            for (const id of objectiveIds.split(' ')) {
                const objective = this.getObjective(id);
                if (!objective) {
                    console.warn(`Step ${step.number} references undefined objective ${id}`);
                    continue;
                }
                objective.steps.push(step);
                step.objectives.push(objective);
            }
        }
    }
}

class BadgeLabel {
    constructor(singular, plural) {
        this.singularLabel = singular;
        this.pluralLabel = plural;
    }

    forItems(items) {
        if (items.length === 1)
            return this.singularLabel + '&nbsp;' + items[0].number;
        else
            return this.pluralLabel;
    }
}

class BadgeFactory {
    create(label, items) {
        const badge = this._createBadge();
        badge.innerHTML = label.forItems(items);
        this._setupTooltip(badge, this._createTooltipContent(items));
        return badge;
    }

    _createBadge() {
        const badge = document.createElement('span');
        badge.classList.add('badge');
        return badge;
    }

    _setupTooltip(badge, content) {
        tippy(badge, {
            content: content,
            interactive: true,
            arrow: true,
            placement: 'right-start',
            theme: 'light-border'
        });
    }

    _createTooltipContent(items) {
        let html = '<ul class="badge-tooltip">';
        for (const item of items) {
            html += `<li class="badge-tooltip__item"><a class="badge-tooltip__link" href="#${item.id}">${item.title}</a></li>`;
        }
        html += '</ul>';
        return html;
    }
}

class ObjectivesConnector {
    constructor() {
        const objective = it4ktTranslations.objective;
        const objectives = it4ktTranslations.objectives;
        const step = it4ktTranslations.step;
        const steps = it4ktTranslations.steps;
        this.badgeFactory = new BadgeFactory();
        this.objectivesLabel = new BadgeLabel(objective, objectives);
        this.stepsLabel = new BadgeLabel(step, steps);
        this.registry = new ObjectivesRegistry();
    }

    connect() {
        this.createObjectiveBadges();
        this.createStepBadges();
    }

    createObjectiveBadges() {
        for (const objective of this.registry.objectives) {
            if (objective.steps.length > 0) {
                const stepsBadge = this.badgeFactory.create(
                    this.stepsLabel, objective.steps);
                objective.element.insertAdjacentHTML('beforeend', ' ');
                objective.element.insertAdjacentElement('beforeend', stepsBadge);
            }
        }
    }

    createStepBadges() {
        for (const step of this.registry.steps) {
            if (step.objectives.length > 0) {
                const stepsBadge = this.badgeFactory.create(
                    this.objectivesLabel, step.objectives);
                const stepHeader = step.element.querySelector('.step__header');
                stepHeader.insertAdjacentHTML('beforeend', ' ');
                stepHeader.insertAdjacentElement('beforeend', stepsBadge);
            }
        }
    }
}
