import { StandaloneServiceProvider } from "@kronos-integration/service";

const sp = new StandaloneServiceProvider();

sp.start().then(() => {
  sp.endpoints.log.addConnection(sp.services.logger.endpoints.log);
  console.log(`e ${sp.endpoints.log}`);
  sp.info("started");
});
