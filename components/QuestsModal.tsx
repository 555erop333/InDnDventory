import React, { useMemo, useState, useEffect } from 'react';
import { X, Scroll, Check, Plus, Trash2, Edit3, CheckCircle2, Circle, Users, Coins } from 'lucide-react';
import { Quest, QuestObjective, QuestStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface QuestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    quests: Quest[];
    onCreateQuest: (quest: Omit<Quest, 'id' | 'createdAt'>) => void;
    onUpdateQuest: (id: string, updates: Partial<Quest>) => void;
    onDeleteQuest: (id: string) => void;
    isDm: boolean;
    characters?: { id: string; name: string; ownerName?: string }[];
}

interface QuestFormState {
    title: string;
    description: string;
    reward: string;
    objectives: QuestObjective[];
    assignedCharacterIds: string[];
}

const emptyForm: QuestFormState = {
    title: '',
    description: '',
    reward: '',
    objectives: [],
    assignedCharacterIds: []
};

const QuestsModal: React.FC<QuestsModalProps> = ({
    isOpen,
    onClose,
    quests,
    onCreateQuest,
    onUpdateQuest,
    onDeleteQuest,
    isDm,
    characters = []
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formState, setFormState] = useState<QuestFormState>(emptyForm);
    const [newObjectiveText, setNewObjectiveText] = useState('');
    const [isAssignAll, setIsAssignAll] = useState(true);

    useEffect(() => {
        if (!isOpen) {
            setIsCreating(false);
            setEditingId(null);
            setFormState(emptyForm);
            setNewObjectiveText('');
            setIsAssignAll(true);
        }
    }, [isOpen]);

    const activeQuests = quests.filter(q => q.status === QuestStatus.ACTIVE);
    const completedQuests = quests.filter(q => q.status === QuestStatus.COMPLETED);

    const characterMap = useMemo(() => (
        characters.reduce<Record<string, { id: string; name: string; ownerName?: string }>>((acc, char) => {
            acc[char.id] = char;
            return acc;
        }, {})
    ), [characters]);

    if (!isOpen) return null;

    const resetForm = () => {
        setFormState(emptyForm);
        setNewObjectiveText('');
        setIsAssignAll(true);
    };

    const startCreate = () => {
        setEditingId(null);
        setIsCreating(true);
        resetForm();
    };

    const handleStartEdit = (quest: Quest) => {
        setIsCreating(false);
        setEditingId(quest.id);
        setFormState({
            title: quest.title,
            description: quest.description,
            reward: quest.reward ?? '',
            objectives: quest.objectives.map(obj => ({ ...obj })),
            assignedCharacterIds: quest.assignedCharacterIds ?? []
        });
        setIsAssignAll((quest.assignedCharacterIds?.length ?? 0) === 0);
        setNewObjectiveText('');
    };

    const handleSubmitQuest = () => {
        if (!formState.title.trim()) return;

        const payload = {
            title: formState.title.trim(),
            description: formState.description.trim(),
            reward: formState.reward.trim(),
            objectives: formState.objectives,
            assignedCharacterIds: isAssignAll ? [] : formState.assignedCharacterIds.filter(Boolean)
        };

        if (editingId) {
            onUpdateQuest(editingId, payload);
            setEditingId(null);
        } else {
            onCreateQuest({
                ...payload,
                status: QuestStatus.ACTIVE
            });
            setIsCreating(false);
        }

        resetForm();
    };

    const handleAddObjective = () => {
        if (!newObjectiveText.trim()) return;

        setFormState(prev => ({
            ...prev,
            objectives: [
                ...prev.objectives,
                {
                    id: uuidv4(),
                    text: newObjectiveText.trim(),
                    completed: false
                }
            ]
        }));
        setNewObjectiveText('');
    };

    const handleRemoveObjective = (id: string) => {
        setFormState(prev => ({
            ...prev,
            objectives: prev.objectives.filter(obj => obj.id !== id)
        }));
    };

    const handleCancelForm = () => {
        resetForm();
        setIsCreating(false);
        setEditingId(null);
    };

    const handleToggleAssignment = (id: string) => {
        setFormState(prev => {
            const exists = prev.assignedCharacterIds.includes(id);
            const updated = exists
                ? prev.assignedCharacterIds.filter(charId => charId !== id)
                : [...prev.assignedCharacterIds, id];
            if (updated.length === 0) {
                setIsAssignAll(true);
            } else {
                setIsAssignAll(false);
            }
            return { ...prev, assignedCharacterIds: updated };
        });
    };

    const handleSelectAllCharacters = () => {
        setIsAssignAll(true);
        setFormState(prev => ({ ...prev, assignedCharacterIds: [] }));
    };

    const isFormVisible = isDm && (isCreating || editingId);
    const isEditing = Boolean(editingId);

    const handleToggleObjective = (questId: string, objectiveId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (!quest) return;

        const updatedObjectives = quest.objectives.map(obj =>
            obj.id === objectiveId ? { ...obj, completed: !obj.completed } : obj
        );

        onUpdateQuest(questId, { objectives: updatedObjectives });
    };

    const handleCompleteQuest = (questId: string) => {
        onUpdateQuest(questId, {
            status: QuestStatus.COMPLETED,
            completedAt: Date.now()
        });
    };

    const handleReopenQuest = (questId: string) => {
        onUpdateQuest(questId, {
            status: QuestStatus.ACTIVE,
            completedAt: undefined
        });
    };

    const handleDeleteQuest = (questId: string) => {
        if (confirm('Удалить этот квест?')) {
            onDeleteQuest(questId);
        }
    };

    const QuestCard: React.FC<{ quest: Quest }> = ({ quest }) => {
        const completedCount = quest.objectives.filter(obj => obj.completed).length;
        const totalCount = quest.objectives.length;
        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        const assignedIds = quest.assignedCharacterIds ?? [];
        const assignedLabel = assignedIds.length === 0
            ? 'Все персонажи'
            : assignedIds
                .map(id => {
                    const person = characterMap[id];
                    if (!person) return 'Неизвестный герой';
                    return person.ownerName ? `${person.name} (${person.ownerName})` : person.name;
                })
                .join(', ');

        return (
            <div className="bg-dnd-dark border border-dnd-muted rounded-lg p-4 hover:border-dnd-gold/50 transition-all">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-dnd-gold flex items-center gap-2">
                            <Scroll size={18} />
                            {quest.title}
                        </h3>
                        {quest.description && (
                            <p className="text-sm text-dnd-muted mt-1">{quest.description}</p>
                        )}
                        {quest.reward && quest.reward.trim().length > 0 && (
                            <div className="text-sm text-dnd-gold mt-2 flex items-center gap-2">
                                <Coins size={14} className="text-dnd-gold/80" />
                                <span className="font-semibold">Награда:</span>
                                <span className="text-dnd-gold/90">{quest.reward}</span>
                            </div>
                        )}
                    </div>
                    {isDm && (
                        <div className="flex gap-1 ml-2">
                            <button
                                onClick={() => handleStartEdit(quest)}
                                className="text-dnd-muted hover:text-dnd-gold p-1 transition"
                            >
                                <Edit3 size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteQuest(quest.id)}
                                className="text-dnd-danger hover:text-red-400 p-1 transition"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {quest.objectives.length > 0 && (
                    <div className="space-y-2 mt-3">
                        {quest.objectives.map(obj => (
                            <div
                                key={obj.id}
                                className="flex items-start gap-2 text-sm group"
                            >
                                <button
                                    onClick={() => handleToggleObjective(quest.id, obj.id)}
                                    className="mt-0.5 flex-shrink-0 text-dnd-muted hover:text-dnd-gold transition"
                                    disabled={!isDm && quest.status === QuestStatus.COMPLETED}
                                >
                                    {obj.completed ? (
                                        <CheckCircle2 size={18} className="text-dnd-success" />
                                    ) : (
                                        <Circle size={18} />
                                    )}
                                </button>
                                <span className={`flex-1 ${obj.completed ? 'line-through text-dnd-muted' : 'text-dnd-text'}`}>
                                    {obj.text}
                                </span>
                            </div>
                        ))}

                        {/* Progress bar */}
                        <div className="mt-3 pt-2 border-t border-dnd-muted/20">
                            <div className="flex items-center justify-between text-xs text-dnd-muted mb-1">
                                <span>Прогресс</span>
                                <span>{completedCount} / {totalCount}</span>
                            </div>
                            <div className="h-2 bg-dnd-panel rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-dnd-gold to-dnd-accent transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-3 pt-2 border-t border-dnd-muted/20 text-xs text-dnd-muted flex items-center gap-2">
                    <Users size={14} className="text-dnd-accent" />
                    <span className="font-semibold text-dnd-text">Назначено:</span>
                    <span className="text-dnd-muted/90">{assignedLabel}</span>
                </div>

                {isDm && quest.status === QuestStatus.ACTIVE && (
                    <button
                        onClick={() => handleCompleteQuest(quest.id)}
                        className="mt-3 w-full bg-dnd-success/10 hover:bg-dnd-success/20 border border-dnd-success text-dnd-success rounded py-1.5 text-sm font-bold transition-all"
                    >
                        <Check size={14} className="inline mr-1" />
                        Завершить квест
                    </button>
                )}

                {isDm && quest.status === QuestStatus.COMPLETED && (
                    <button
                        onClick={() => handleReopenQuest(quest.id)}
                        className="mt-3 w-full bg-dnd-accent/10 hover:bg-dnd-accent/20 border border-dnd-accent text-dnd-accent rounded py-1.5 text-sm font-bold transition-all"
                    >
                        <Plus size={14} className="inline mr-1" />
                        Вернуть в активные
                    </button>
                )}

                {quest.status === QuestStatus.COMPLETED && quest.completedAt && (
                    <div className="mt-3 text-xs text-dnd-success text-center border-t border-dnd-success/20 pt-2">
                        ✓ Завершён {new Date(quest.completedAt).toLocaleDateString('ru-RU')}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-dnd-panel w-full max-w-2xl rounded-xl border border-dnd-gold shadow-2xl flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-dnd-muted">
                    <div className="flex items-center gap-2 text-dnd-gold">
                        <Scroll size={24} />
                        <h2 className="text-xl font-bold">Журнал Квестов</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDm && !isCreating && !editingId && (
                            <button
                                onClick={startCreate}
                                className="bg-dnd-gold/10 hover:bg-dnd-gold/20 border border-dnd-gold text-dnd-gold rounded px-3 py-1.5 text-sm font-bold transition-all flex items-center gap-1"
                            >
                                <Plus size={16} />
                                Создать квест
                            </button>
                        )}
                        <button onClick={onClose} className="text-dnd-muted hover:text-white transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Create Quest Form */}
                    {isFormVisible && (
                        <div className="bg-dnd-dark border-2 border-dnd-gold rounded-lg p-4 space-y-3">
                            <h3 className="font-bold text-dnd-gold flex items-center gap-2">
                                <Plus size={18} />
                                {isEditing ? 'Редактирование квеста' : 'Новый Квест'}
                            </h3>

                            <input
                                type="text"
                                placeholder="Название квеста..."
                                value={formState.title}
                                onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full bg-dnd-panel border border-dnd-muted rounded px-3 py-2 text-sm focus:border-dnd-accent outline-none"
                                autoFocus
                            />

                            <textarea
                                placeholder="Описание (опционально)..."
                                value={formState.description}
                                onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full bg-dnd-panel border border-dnd-muted rounded px-3 py-2 text-sm focus:border-dnd-accent outline-none resize-none"
                                rows={2}
                            />

                            <input
                                type="text"
                                placeholder="Награда (например, 300 зм или редкий предмет)"
                                value={formState.reward}
                                onChange={(e) => setFormState(prev => ({ ...prev, reward: e.target.value }))}
                                className="w-full bg-dnd-panel border border-dnd-muted rounded px-3 py-2 text-sm focus:border-dnd-accent outline-none"
                            />

                            <div className="space-y-2">
                                <label className="text-xs text-dnd-muted font-bold">Задачи квеста:</label>
                                {formState.objectives.map((obj, idx) => (
                                    <div key={obj.id} className="flex items-center gap-2">
                                        <span className="text-xs text-dnd-muted">{idx + 1}.</span>
                                        <span className="flex-1 text-sm bg-dnd-panel px-2 py-1 rounded">{obj.text}</span>
                                        <button
                                            onClick={() => handleRemoveObjective(obj.id)}
                                            className="text-dnd-danger hover:text-red-400 transition"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Добавить задачу..."
                                        value={newObjectiveText}
                                        onChange={(e) => setNewObjectiveText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddObjective()}
                                        className="flex-1 bg-dnd-panel border border-dnd-muted rounded px-3 py-1.5 text-sm focus:border-dnd-accent outline-none"
                                    />
                                    <button
                                        onClick={handleAddObjective}
                                        className="bg-dnd-accent/10 hover:bg-dnd-accent/20 border border-dnd-accent text-dnd-accent rounded px-3 py-1.5 text-sm transition-all"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-dnd-muted font-bold">Кому назначен квест:</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAllCharacters}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${isAssignAll ? 'bg-dnd-gold text-dnd-dark border-dnd-gold' : 'bg-dnd-panel text-dnd-muted border-dnd-muted hover:border-dnd-gold/60'}`}
                                    >
                                        Все персонажи
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAssignAll(false)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${!isAssignAll ? 'bg-purple-500/20 text-purple-200 border-purple-400' : 'bg-dnd-panel text-dnd-muted border-dnd-muted hover:border-purple-400/60'}`}
                                    >
                                        Выбрать вручную
                                    </button>
                                </div>

                                {!isAssignAll && (
                                    <div className="max-h-40 overflow-y-auto border border-dnd-muted/40 rounded-lg divide-y divide-dnd-muted/20 bg-black/20">
                                        {characters.length === 0 && (
                                            <p className="text-xs text-center text-dnd-muted py-3">Нет доступных персонажей</p>
                                        )}
                                        {characters.map(char => {
                                            const checked = formState.assignedCharacterIds.includes(char.id);
                                            return (
                                                <label key={char.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-white/5">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => handleToggleAssignment(char.id)}
                                                        className="accent-dnd-gold"
                                                    />
                                                    <span className="flex-1 text-dnd-text font-medium">{char.name}</span>
                                                    {char.ownerName && <span className="text-[11px] text-dnd-muted">({char.ownerName})</span>}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                                <p className="text-[11px] text-dnd-muted">{isAssignAll ? 'Квест будет отображаться всем персонажам.' : 'Если не выбрать ни одного персонажа, квест снова будет виден всем.'}</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleSubmitQuest}
                                    disabled={!formState.title.trim()}
                                    className="flex-1 bg-dnd-gold hover:bg-dnd-gold/80 text-dnd-dark font-bold rounded py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isEditing ? 'Сохранить' : 'Создать'}
                                </button>
                                <button
                                    onClick={handleCancelForm}
                                    className="flex-1 bg-dnd-panel hover:bg-dnd-muted border border-dnd-muted text-dnd-text rounded py-2 transition-all"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Active Quests */}
                    {activeQuests.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-dnd-accent mb-3 flex items-center gap-2">
                                <Circle size={14} />
                                Активные квесты ({activeQuests.length})
                            </h3>
                            <div className="space-y-3">
                                {activeQuests.map(quest => <QuestCard key={quest.id} quest={quest} />)}
                            </div>
                        </div>
                    )}

                    {/* Completed Quests */}
                    {completedQuests.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-dnd-success mb-3 flex items-center gap-2">
                                <CheckCircle2 size={14} />
                                Завершённые квесты ({completedQuests.length})
                            </h3>
                            <div className="space-y-3 opacity-75">
                                {completedQuests.map(quest => <QuestCard key={quest.id} quest={quest} />)}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {quests.length === 0 && !isCreating && !editingId && (
                        <div className="text-center text-dnd-muted py-10 opacity-50">
                            <Scroll size={48} className="mx-auto mb-2" />
                            <p>Квестов пока нет</p>
                            {isDm && <p className="text-xs mt-1">Создайте первый квест!</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestsModal;
