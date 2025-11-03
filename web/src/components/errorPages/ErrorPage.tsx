import ErrorPageLayout from "@/components/errorPages/ErrorPageLayout";
import Text from "@/refresh-components/texts/Text";
import SvgAlertCircle from "@/icons/alert-circle";

export default function Error() {
  return (
    <ErrorPageLayout>
      <div className="flex flex-row items-center gap-2">
        <Text headingH2>Wir sind auf ein Problem gestoßen.</Text>
        <SvgAlertCircle className="w-[1.5rem] h-[1.5rem] stroke-text-04" />
      </div>

      <Text text03>
      Es scheint ein Problem beim Laden Ihrer Onyx-Einstellungen aufgetreten zu sein. 
      Dies könnte an einem Konfigurationsproblem oder einer unvollständigen Einrichtung liegen.
      </Text>

      <Text text03>
      Wenn Sie Administrator sind, lesen Sie bitte unsere{" "}
        <a
          className="text-action-link-05"
          href="https://docs.onyx.app/?utm_source=app&utm_medium=error_page&utm_campaign=config_error"
          target="_blank"
          rel="noopener noreferrer"
        >
          Dokumentation
        </a>{" "}
        für die richtigen Konfigurationsschritte. 
        Wenn Sie ein Benutzer sind, wenden Sie sich bitte an Ihren Administrator, um Unterstützung zu erhalten.
      </Text>

      <Text text03>
        Need help? Join our{" "}
        <a
          className="text-action-link-05"
          href="https://discord.gg/4NA5SbzrWb"
          target="_blank"
          rel="noopener noreferrer"
        >
          Discord community
        </a>{" "}
        for support.
      </Text>
    </ErrorPageLayout>
  );
}
