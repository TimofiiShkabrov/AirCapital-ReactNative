import { useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { useStore } from "zustand";
import { createLoadTask } from "../services/loadTask";

export function useScreenLoad<T>(loader: () => Promise<T>) {
  // A changed route/loader gets its own task; an old response cannot replace it.
  const task = useMemo(() => createLoadTask(loader), [loader]);
  const state = useStore(task);
  const reload = task.getState().reload;
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );
  return state;
}
