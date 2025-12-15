"use client";

import React, { useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useProjectsContext } from "../../projects/ProjectsContext";
import FilePickerPopover from "@/refresh-components/popovers/FilePickerPopover";
import type { ProjectFile } from "../../projects/projectsService";
import { UserFileStatus } from "../../projects/projectsService";
import { usePopup } from "@/components/admin/connectors/Popup";
import { MinimalOnyxDocument } from "@/lib/search/interfaces";
import Button from "@/refresh-components/buttons/Button";
import {
  useChatModal,
  ModalIds,
} from "@/refresh-components/contexts/ChatModalContext";
import AddInstructionModal from "@/components/modals/AddInstructionModal";
import UserFilesModalContent from "@/components/modals/UserFilesModalContent";
import { useEscape } from "@/hooks/useKeyPress";
import CoreModal from "@/refresh-components/modals/CoreModal";
import Text from "@/refresh-components/texts/Text";
import SvgFileText from "@/icons/file-text";
import SvgFolderOpen from "@/icons/folder-open";
import SvgAddLines from "@/icons/add-lines";
import SvgFiles from "@/icons/files";
import Truncated from "@/refresh-components/texts/Truncated";
import CreateButton from "@/refresh-components/buttons/CreateButton";
import { useEffect, useState } from "react";
import { fetchUploadConstraints, UploadConstraints } from "@/lib/utils";
export function FileCard({
  file,
  removeFile,
  hideProcessingState = false,
  onFileClick,
}: {
  file: ProjectFile;
  removeFile: (fileId: string) => void;
  hideProcessingState?: boolean;
  onFileClick?: (file: ProjectFile) => void;
}) {
  const typeLabel = useMemo(() => {
    const name = String(file.name || "");
    const lastDotIndex = name.lastIndexOf(".");
    if (lastDotIndex <= 0 || lastDotIndex === name.length - 1) {
      return "";
    }
    return name.slice(lastDotIndex + 1).toUpperCase();
  }, [file.name]);

  const isActuallyProcessing =
    String(file.status) === UserFileStatus.UPLOADING ||
    String(file.status) === UserFileStatus.PROCESSING;

  // When hideProcessingState is true, we treat processing files as completed for display purposes
  const isProcessing = true;

  const handleRemoveFile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFile(file.id);
  };

  return (
    <div
      className={`relative group flex items-center gap-3 border border-border-01 rounded-12 ${
        isProcessing ? "bg-background-neutral-02" : "bg-background-tint-00"
      } p-1 h-14 w-40 ${
        onFileClick && !isProcessing
          ? "cursor-pointer hover:bg-accent-background"
          : ""
      }`}
      onClick={() => {
        if (onFileClick && !isProcessing) {
          onFileClick(file);
        }
      }}
    >
      {String(file.status) !== UserFileStatus.UPLOADING && (
        <button
          onClick={handleRemoveFile}
          title="Datei löschen"
          aria-label="Delete file"
          className="absolute -left-2 -top-2 z-10 h-5 w-5 flex items-center justify-center rounded-[4px] border border-border text-[11px] bg-[#1f1f1f] text-white dark:bg-[#fefcfa] dark:text-black shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 pointer-events-none group-hover:pointer-events-auto focus:pointer-events-auto transition-opacity duration-150 hover:opacity-90"
        >
          <X className="h-4 w-4 dark:text-dark-tremor-background-muted" />
        </button>
      )}
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-08 p-2
      ${isProcessing ? "bg-background-neutral-03" : "bg-background-tint-01"}`}
      >
        {isProcessing || 
          file.status === UserFileStatus.UPLOADING ||
          file.status === UserFileStatus.PROCESSING
           ? (
          <Loader2 className="h-5 w-5 text-text-01 animate-spin" />
        ) : (
          <SvgFileText className="h-5 w-5 stroke-text-02" />
        )}
      </div>
      <div className="flex flex-col overflow-hidden">
        <Truncated
          className={`font-secondary-action truncate
          ${isProcessing ? "text-text-03" : "text-text-04"}`}
          title={file.name}
        >
          {file.name}
        </Truncated>
        <Text text03 secondaryBody nowrap className="truncate">
          {isProcessing
            ? file.status === UserFileStatus.UPLOADING
              ? "Datei wird hochgeladen..."
              : "Datei wird verarbeitet..."
            : typeLabel}
        </Text>
      </div>
    </div>
  );
}

export default function ProjectContextPanel({
  projectTokenCount = 0,
  availableContextTokens = 128_000,
  setPresentingDocument,
}: {
  projectTokenCount?: number;
  availableContextTokens?: number;
  setPresentingDocument?: (document: MinimalOnyxDocument) => void;
}) {
  const { popup, setPopup } = usePopup();
  const { isOpen, toggleModal } = useChatModal();
  const open = isOpen(ModalIds.ProjectFilesModal);
  const onClose = () => toggleModal(ModalIds.ProjectFilesModal, false);
  useEscape(onClose, open);
  // Convert ProjectFile to MinimalOnyxDocument format for viewing
  const handleOnView = useCallback(
    (file: ProjectFile) => {
      if (!setPresentingDocument) return;

      const documentForViewer: MinimalOnyxDocument = {
        document_id: `project_file__${file.file_id}`,
        semantic_identifier: file.name,
      };

      setPresentingDocument(documentForViewer);
    },
    [setPresentingDocument]
  );
  const {
    currentProjectDetails,
    currentProjectId,
    unlinkFileFromProject,
    linkFileToProject,
    allCurrentProjectFiles,
    beginUpload,
    projects,
  } = useProjectsContext();
  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) return;
      beginUpload(Array.from(files), currentProjectId, setPopup);
    },
    [currentProjectId, beginUpload]
  );

  const [uploadConstraints, setUploadConstraints] = useState<UploadConstraints | null>(null);

useEffect(() => {
  fetchUploadConstraints()
    .then(setUploadConstraints)
    .catch(() => {
      setUploadConstraints({
        plain_text: [".txt", ".md"],
        document: [".pdf", ".docx"],
        image: [".png", ".jpg"],
        all: [".txt", ".md", ".pdf", ".docx", ".png", ".jpg"],
      });
    });
}, []);


  const totalFiles = allCurrentProjectFiles.length;
  const displayFileCount = totalFiles > 100 ? "100+" : String(totalFiles);

  const handleUploadChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      await handleUploadFiles(Array.from(files));
      e.target.value = "";
    },
    [handleUploadFiles]
  );

  // Nested dropzone for drag-and-drop within ProjectContextPanel
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    noKeyboard: true,
    multiple: true,
    noDragEventsBubbling: true,
    onDrop: (acceptedFiles) => {
      void handleUploadFiles(acceptedFiles);
    },
  });

  if (!currentProjectId) return null; // no selection yet

  return (
    <div className="flex flex-col gap-6 w-full max-w-[800px] mx-auto mt-10 mb-[1.5rem]">
      <div className="flex flex-col gap-1 text-text-04">
        <SvgFolderOpen className="h-8 w-8 text-text-04" />
        <Text headingH2 className="font-heading-h2">
          {projects.find((p) => p.id === currentProjectId)?.name ||
            "Projekt wird geladen..."}
        </Text>
      </div>

      <Separator className="my-0" />
      <div className="flex flex-row gap-2 justify-between">
        <div className="min-w-0">
          <Text headingH3 text04>
            Anweisungen
          </Text>
          {currentProjectDetails?.project?.instructions ? (
            <Text text02 secondaryBody className="truncate">
              {currentProjectDetails.project.instructions}
            </Text>
          ) : (
            <Text text02 secondaryBody className="truncate">
              Füge Anweisuungen hinzu, um die Antworten für dieses Projekt bestimmten Regeln anzupassen.
            </Text>
          )}
        </div>
        <Button
          leftIcon={SvgAddLines}
          onClick={() => toggleModal(ModalIds.AddInstructionModal, true)}
          tertiary
        >
          Anweisung erstellen
        </Button>
      </div>
      <div
        className="flex flex-col gap-2 "
        {...getRootProps({ onClick: (e) => e.stopPropagation() })}
      >
        <div className="flex flex-row gap-2 justify-between">
          <div>
            <Text headingH3 text04>
              Datei
            </Text>
            <Text text02 secondaryBody>
              Chats in diesem Projekt haben Zugriff auf diese Dateien.
            </Text>
          </div>
          <FilePickerPopover
            trigger={(open) => (
              // The `secondary={undefined}` is required here because `CreateButton` sets it to true.
              // Therefore, we need to first remove the truthiness before passing in the other `tertiary` flag.
              <CreateButton secondary={undefined} tertiary active={open}>
                Dateien hinzufügen
              </CreateButton>
            )}
            onFileClick={handleOnView}
            onPickRecent={async (file) => {
              if (!currentProjectId) return;
              if (!linkFileToProject) return;
              linkFileToProject(currentProjectId, file);
            }}
            onUnpickRecent={async (file) => {
              if (!currentProjectId) return;
              await unlinkFileFromProject(currentProjectId, file.id);
            }}
            handleUploadChange={handleUploadChange}
            selectedFileIds={(allCurrentProjectFiles || []).map((f) => f.id)}
          />
        </div>
        {/* Hidden input just to satisfy dropzone contract; we rely on FilePicker for clicks */}
        <input
        {...getInputProps({
          accept: uploadConstraints?.all.join(","),
        })}
        data-testid="project-context-file-input"
      />
              {uploadConstraints && (
          <p className="text-xs text-text-03 mt-1">
            Allowed: {uploadConstraints.all.join(", ")}
          </p>
        )}
        {allCurrentProjectFiles.length > 0 ? (
          <>
            {/* Mobile / small screens: just show a button to view files */}
            <div className="sm:hidden">
              <button
                className="w-full rounded-xl px-3 py-3 text-left bg-transparent hover:bg-accent-background-hovered hover:dark:bg-neutral-800/75 transition-colors"
                onClick={() => toggleModal(ModalIds.ProjectFilesModal, true)}
              >
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between gap-2 w-full">
                    <Text text04 secondaryAction>
                      Dateien betrachten
                    </Text>
                    <SvgFiles className="h-5 w-5 stroke-text-02" />
                  </div>
                  <Text text03 secondaryBody>
                    {displayFileCount} files
                  </Text>
                </div>
              </button>
            </div>

            {/* Desktop / larger screens: show previews with optional View All */}
            <div className="hidden sm:flex gap-1 relative">
              {(() => {
                return allCurrentProjectFiles.slice(0, 4).map((f) => (
                  <div key={f.id} className="w-40">
                    <FileCard
                      file={f}
                      removeFile={async (fileId: string) => {
                        if (!currentProjectId) return;
                        await unlinkFileFromProject(currentProjectId, fileId);
                      }}
                      onFileClick={handleOnView}
                    />
                  </div>
                ));
              })()}
              {totalFiles > 4 && (
                <button
                  className="rounded-xl px-3 py-1 text-left transition-colors hover:bg-background-tint-02"
                  onClick={() => toggleModal(ModalIds.ProjectFilesModal, true)}
                >
                  <div className="flex flex-col overflow-hidden h-12 p-1">
                    <div className="flex items-center justify-between gap-2 w-full">
                      <Text text04 secondaryAction>
                        Alle anzeigen
                      </Text>
                      <SvgFiles className="h-5 w-5 stroke-text-02" />
                    </div>
                    <Text text03 secondaryBody>
                      {displayFileCount} files
                    </Text>
                  </div>
                </button>
              )}
              {isDragActive && (
                <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-dashed border-action-link-05" />
              )}
            </div>
            {projectTokenCount > availableContextTokens && (
              <Text text02 secondaryBody>
                Dieses Projekt übersteigt das Kontextfeld des Modells. In der Sitzung 
                wird automatisch nach relevanten Dateien gesucht bevor eine 
                Antwort generiert wird.
              </Text>
            )}
          </>
        ) : (
          <div
            className={`h-12 rounded-lg border border-dashed ${
              isDragActive
                ? "bg-action-link-01 border-action-link-05"
                : "border-border-01"
            } flex items-center pl-2`}
          >
            <p
              className={`font-secondary-body ${
                isDragActive ? "text-action-link-05" : "text-text-02 "
              }`}
            >
              {isDragActive
                ? "Datei hierhin ziehen, um sie dem Projekt hinzuzufügen"
                : "Fügen Sie Dokumente oder Text hinzu, die für das Projekt relevant sind. Drag & drop ist unterstützt."}
            </p>
          </div>
        )}
      </div>

      <AddInstructionModal />

      {open && (
        <CoreModal
          className="w-[32rem] rounded-16 border flex flex-col bg-background-tint-00"
          onClickOutside={onClose}
        >
          <UserFilesModalContent
            title="Projekt-Dateien"
            description="Sitzungen dieses Projekts können auf die hier abgelegten Dateien zugreifen."
            icon={SvgFiles}
            recentFiles={[...allCurrentProjectFiles]}
            onView={handleOnView}
            handleUploadChange={handleUploadChange}
            onDelete={async (file: ProjectFile) => {
              if (!currentProjectId) return;
              await unlinkFileFromProject(currentProjectId, file.id);
            }}
            onClose={onClose}
          />
        </CoreModal>
      )}
      {popup}
    </div>
  );
}
