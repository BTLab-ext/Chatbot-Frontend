import { useState } from "react";
import Button from "@/refresh-components/buttons/Button";
import { Callout } from "@/components/ui/callout";
import Text from "@/components/ui/text";
import { ChatSession, ChatSessionSharedStatus } from "@/app/chat/interfaces";
import { SEARCH_PARAM_NAMES } from "@/app/chat/services/searchParams";
import { usePopup } from "@/components/admin/connectors/Popup";
import { structureValue } from "@/lib/llm/utils";
import { LlmDescriptor, useLlmManager } from "@/lib/hooks";
import { Separator } from "@/components/ui/separator";
import { AdvancedOptionsToggle } from "@/components/AdvancedOptionsToggle";
import { cn } from "@/lib/utils";
import { useAgentsContext } from "@/refresh-components/contexts/AgentsContext";
import { useSearchParams } from "next/navigation";
import { useChatContext } from "@/refresh-components/contexts/ChatContext";
import { useChatSessionStore } from "@/app/chat/stores/useChatSessionStore";
import ConfirmationModal from "@/refresh-components/modals/ConfirmationModal";
import SvgShare from "@/icons/share";
import SvgCopy from "@/icons/copy";
import IconButton from "@/refresh-components/buttons/IconButton";
import { copyAll } from "@/app/chat/message/copyingUtils";

function buildShareLink(chatSessionId: string) {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  return `${baseUrl}/chat/shared/${chatSessionId}`;
}

async function generateShareLink(chatSessionId: string) {
  const response = await fetch(`/api/chat/chat-session/${chatSessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sharing_status: "public" }),
  });

  if (response.ok) {
    return buildShareLink(chatSessionId);
  }
  return null;
}

async function generateSeedLink(
  message?: string,
  assistantId?: number,
  modelOverride?: LlmDescriptor
) {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const model = modelOverride
    ? structureValue(
        modelOverride.name,
        modelOverride.provider,
        modelOverride.modelName
      )
    : null;
  return `${baseUrl}/chat${
    message
      ? `?${SEARCH_PARAM_NAMES.USER_PROMPT}=${encodeURIComponent(message)}`
      : ""
  }${
    assistantId
      ? `${message ? "&" : "?"}${SEARCH_PARAM_NAMES.PERSONA_ID}=${assistantId}`
      : ""
  }${
    model
      ? `${message || assistantId ? "&" : "?"}${
          SEARCH_PARAM_NAMES.STRUCTURED_MODEL
        }=${encodeURIComponent(model)}`
      : ""
  }${message ? `&${SEARCH_PARAM_NAMES.SEND_ON_LOAD}=true` : ""}`;
}

async function deleteShareLink(chatSessionId: string) {
  const response = await fetch(`/api/chat/chat-session/${chatSessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sharing_status: "private" }),
  });

  return response.ok;
}

interface ShareChatSessionModalProps {
  chatSession: ChatSession;
  onClose: () => void;
}

export default function ShareChatSessionModal({
  chatSession,
  onClose,
}: ShareChatSessionModalProps) {
  const [shareLink, setShareLink] = useState<string>(
    chatSession.shared_status === ChatSessionSharedStatus.Public
      ? buildShareLink(chatSession.id)
      : ""
  );
  const { popup, setPopup } = usePopup();
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const { currentAgent } = useAgentsContext();
  const searchParams = useSearchParams();
  const message = searchParams?.get(SEARCH_PARAM_NAMES.USER_PROMPT) || "";
  const { llmProviders } = useChatContext();
  const llmManager = useLlmManager(
    llmProviders,
    chatSession,
    currentAgent || undefined
  );
  const updateCurrentChatSessionSharedStatus = useChatSessionStore(
    (state) => state.updateCurrentChatSessionSharedStatus
  );

  return (
    <>
      {popup}

      <ConfirmationModal
        icon={SvgShare}
        title="Chat teilen"
        onClose={onClose}
        submit={<Button>Teilen</Button>}
      >
        {shareLink ? (
          <div>
            <Text>
            Diese Chat-Sitzung wird derzeit geteilt. Alle Mitglieder Ihres Teams können den Nachrichtenverlauf über den folgenden Link einsehen:
            </Text>

            <div className={cn("flex mt-2")}>
              {/* <CopyButton content={shareLink} /> */}
              <IconButton
                icon={SvgCopy}
                onClick={() => copyAll(shareLink)}
                secondary
              />
              <a
                href={shareLink}
                target="_blank"
                className={cn(
                  "underline mt-1 ml-1 text-sm my-auto",
                  "text-action-link-05"
                )}
                rel="noreferrer"
              >
                {shareLink}
              </a>
            </div>

            <Separator />

            <Text className={cn("mb-4")}>
              Klicken Sie auf den Button unten, um den Chat wieder privat zu machen.
            </Text>

            <Button
              onClick={async () => {
                const success = await deleteShareLink(chatSession.id);
                if (success) {
                  setShareLink("");
                  updateCurrentChatSessionSharedStatus(
                    ChatSessionSharedStatus.Private
                  );
                } else {
                  alert("Löschen des Freigabelinks fehlgeschlagen");
                }
              }}
              danger
            >
              Freigabelink löschen
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-spacing-interline">
            <Callout type="warning" title="Warnung">
            Bitte stellen Sie sicher, dass alle Inhalte in diesem Chat für das gesamte Team geeignet sind.
            </Callout>
            <Button
              leftIcon={SvgCopy}
              onClick={async () => {
                // NOTE: for "insecure" non-https setup, the `navigator.clipboard.writeText` may fail
                // as the browser may not allow the clipboard to be accessed.
                try {
                  const shareLink = await generateShareLink(chatSession.id);
                  if (!shareLink) {
                    alert("Fehler beim Generieren des Freigabelinks");
                  } else {
                    setShareLink(shareLink);
                    updateCurrentChatSessionSharedStatus(
                      ChatSessionSharedStatus.Public
                    );
                    copyAll(shareLink);
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              secondary
            >
              Link zum Teilen generieren und kopieren
            </Button>
          </div>
        )}

        <Separator className={cn("my-4")} />

        <AdvancedOptionsToggle
          showAdvancedOptions={showAdvancedOptions}
          setShowAdvancedOptions={setShowAdvancedOptions}
          title="Erweiterte Optionen"
        />

        {showAdvancedOptions && (
          <div className="flex flex-col gap-spacing-interline">
            <Callout type="notice" title="Seed-Chat starten">
            Erstellen Sie einen Link zu einer neuen Chat-Sitzung mit denselben Einstellungen wie dieser Chat.
            </Callout>
            <Button
              leftIcon={SvgCopy}
              onClick={async () => {
                try {
                  const seedLink = await generateSeedLink(
                    message,
                    currentAgent?.id,
                    llmManager.currentLlm
                  );
                  if (!seedLink) {
                    setPopup({
                      message: "Fehler beim Generieren des Links",
                      type: "error",
                    });
                  } else {
                    navigator.clipboard.writeText(seedLink);
                    copyAll(seedLink);
                    setPopup({
                      message: "Link in die Zwischenablage kopiert!",
                      type: "success",
                    });
                  }
                } catch (e) {
                  console.error(e);
                  alert("Link konnte nicht generiert oder kopiert werden.");
                }
              }}
              secondary
            >
              Seed-Link generieren und kopieren
            </Button>
          </div>
        )}
      </ConfirmationModal>
    </>
  );
}
