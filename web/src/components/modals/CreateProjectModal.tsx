"use client";

import { useRef } from "react";
import Button from "@/refresh-components/buttons/Button";
import SvgFolderPlus from "@/icons/folder-plus";
import Modal from "@/refresh-components/modals/Modal";
import {
  ModalIds,
  useChatModal,
} from "@/refresh-components/contexts/ChatModalContext";
import { useProjectsContext } from "@/app/chat/projects/ProjectsContext";
import { useKeyPress } from "@/hooks/useKeyPress";
import FieldInput from "@/refresh-components/inputs/FieldInput";
import { useAppRouter } from "@/hooks/appNavigation";

export default function CreateProjectModal() {
  const { createProject } = useProjectsContext();
  const { toggleModal } = useChatModal();
  const fieldInputRef = useRef<HTMLInputElement>(null);
  const route = useAppRouter();

  async function handleSubmit() {
    if (!fieldInputRef.current) return;
    const name = fieldInputRef.current.value.trim();
    if (!name) return;

    try {
      const newProject = await createProject(name);
      route({ projectId: newProject.id });
    } catch (e) {
      console.error(`Folgendes Projekt konnte nicht erstellt werden: ${name}`);
    }

    toggleModal(ModalIds.CreateProjectModal, false);
  }

  useKeyPress(handleSubmit, "Enter");

  return (
    <Modal
      id={ModalIds.CreateProjectModal}
      icon={SvgFolderPlus}
      title="Neues Projekt erstellen"
      description="Nutzen Sie Projekte, um Dateien und Chathistorien an einem Ort zu organsisieren. Sie können außerdem eigene Richtlinien definieren."
      xs
    >
      <div className="flex flex-col p-4 bg-background-tint-01">
        <FieldInput
          label="Projektname"
          placeholder="Woran arbeiten Sie?"
          ref={fieldInputRef}
        />
      </div>
      <div className="flex flex-row justify-end gap-2 p-4">
        <Button
          secondary
          onClick={() => toggleModal(ModalIds.CreateProjectModal, false)}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Create Project</Button>
      </div>
    </Modal>
  );
}
