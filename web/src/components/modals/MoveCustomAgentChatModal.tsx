"use client";

import { useState } from "react";
import ConfirmationModal from "@/refresh-components/modals/ConfirmationModal";
import Button from "@/refresh-components/buttons/Button";
import { Checkbox } from "@/components/ui/checkbox";
import Text from "@/refresh-components/texts/Text";
import SvgAlertCircle from "@/icons/alert-circle";

interface MoveCustomAgentChatModalProps {
  onCancel: () => void;
  onConfirm: (doNotShowAgain: boolean) => void;
}

export default function MoveCustomAgentChatModal({
  onCancel,
  onConfirm,
}: MoveCustomAgentChatModalProps) {
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  return (
    <ConfirmationModal
      icon={SvgAlertCircle}
      title="Benutzerdefinierten Chat Agent verschieben"
      onClose={onCancel}
      submit={
        <Button primary onClick={() => onConfirm(doNotShowAgain)}>
          Verschieben bestätigen
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Text text03>
          Dieser Chat nutzt einen <b>custom agent</b>. Wenn Sie diesen in  <b>project</b>{" "}
          verschieben, werden die Einstellungen und die Wissensbasis des Agenten nicht verändert.
          Dies sollte nur zur besseren Übersicht geschehen.
        </Text>
        <div className="flex items-center gap-1">
          <Checkbox
            id="move-custom-agent-do-not-show"
            checked={doNotShowAgain}
            onCheckedChange={(checked) => setDoNotShowAgain(Boolean(checked))}
          />
          <label
            htmlFor="move-custom-agent-do-not-show"
            className="text-text-03 text-sm"
          >
            Nicht wieder anzeigen
          </label>
        </div>
      </div>
    </ConfirmationModal>
  );
}
