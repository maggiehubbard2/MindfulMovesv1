import AddGoal from '@/components/AddGoal';
import { useGoals } from '@/context/GoalsContext';
import React from 'react';

export default function AddGoalScreen() {
  const { addGoal } = useGoals();
  return <AddGoal onAddGoal={addGoal} />;
}



