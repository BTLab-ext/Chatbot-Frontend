"use client";

import { useEffect, useState } from "react";
import Button from "@/refresh-components/buttons/Button";
import Modal from "@/refresh-components/modals/Modal";
import {
  ModalIds,
  useChatModal,
} from "@/refresh-components/contexts/ChatModalContext";
import { useProjectsContext } from "@/app/chat/projects/ProjectsContext";
import { useKeyPress } from "@/hooks/useKeyPress";
import SvgAddLines from "@/icons/add-lines";
import { Textarea } from "@/components/ui/textarea";

export default function AddInstructionModal() {
  const { isOpen, toggleModal } = useChatModal();
  const open = isOpen(ModalIds.AddInstructionModal);
  const { currentProjectDetails, upsertInstructions } = useProjectsContext();
  const [instructionText, setInstructionText] = useState("");

  const onClose = () => toggleModal(ModalIds.AddInstructionModal, false);

  useEffect(() => {
    if (open) {
      const preset = currentProjectDetails?.project?.instructions ?? "";
      setInstructionText(preset);
    }
  }, [open, currentProjectDetails?.project?.instructions]);

  async function handleSubmit() {
    const value = instructionText.trim();
    try {
      await upsertInstructions(value);
    } catch (e) {
      console.error("Failed to save instructions", e);
    }
    toggleModal(ModalIds.AddInstructionModal, false);
  }

  return (
    <Modal
      id={ModalIds.AddInstructionModal}
      icon={SvgAddLines}
      title="Projektanweisungen festlegen"
      description="Legen Sie fest, welche Verhaltensweisen, Schwerpunkte, Tonarten order Antwortformate im Projekt verwendet werden sollen."
      xs
    >
      <div className="bg-background-tint-01 p-4">
        <Textarea
          value={instructionText}
          onChange={(e) => setInstructionText(e.target.value)}
          placeholder="Gehen Sie bei komplexen Problemen Schritt für Schritt vor und erklären Sie Ihre Lösung. Bitte verwenden Sie konkrete Beispiele."
          className="min-h-[140px] border-border-01 bg-background-neutral-00"
        />
      </div>
      <div className="flex flex-row justify-end gap-2 p-4">
        <Button secondary onClick={onClose}>
          Abbrechen
        </Button>
        <Button onClick={handleSubmit}>Speichern</Button>
      </div>
    </Modal>
  );
}
