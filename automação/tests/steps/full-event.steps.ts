import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

Given('que o organizador inicia a jornada Full Event', async ({ fullEvent }) => {
  await fullEvent.prepare();
});

When('cria e publica o evento', async ({ fullEvent }) => {
  await fullEvent.createAndPublishEvent();
});

When('configura as categorias oficiais com duração', async ({ fullEvent }) => {
  await fullEvent.configureCategoriesAndDuration();
});

When('cadastra as equipes do campeonato', async ({ fullEvent }) => {
  await fullEvent.registerTeams();
});

When('cadastra os atletas do campeonato', async ({ fullEvent }) => {
  await fullEvent.registerAthletes();
});

When('avança o evento para inscrição', async ({ fullEvent }) => {
  await fullEvent.openInscriptions();
});

When('inscreve os atletas', async ({ fullEvent }) => {
  await fullEvent.registerAthletesInEvent();
});

When('avança o evento para pagamento', async ({ fullEvent }) => {
  await fullEvent.openPayment();
});

When('reserva o pagamento sem Asaas', async ({ fullEvent }) => {
  await fullEvent.reservePaymentWithoutAsaas();
});

When('efetiva as inscrições por baixa manual', async ({ fullEvent }) => {
  await fullEvent.settleManually();
});

When('avança o evento para checagem', async ({ fullEvent }) => {
  await fullEvent.openChecking();
});

Then('a lista de checagem deve exibir as inscrições efetivadas', async ({ fullEvent }) => {
  await fullEvent.assertCheckingList();
});

When('travo a checagem', async ({ fullEvent }) => {
  await fullEvent.lockChecking();
});

When('avanço o evento para chaves', async ({ fullEvent }) => {
  await fullEvent.openBracketsPhase();
});

When('gero as chaves final_2, copo_3 e semi_4', async ({ fullEvent }) => {
  await fullEvent.generateOfficialBrackets();
});

When('ajusto manualmente a chave em rascunho', async ({ fullEvent }) => {
  await fullEvent.adjustDraftBracket();
});

When('publico as chaves', async ({ fullEvent }) => {
  await fullEvent.publishBrackets();
});

Then('a chave pública deve estar correta e sem dados administrativos', async ({ fullEvent }) => {
  await fullEvent.assertPublicBrackets();
});

When('configuro as áreas', async ({ fullEvent }) => {
  await fullEvent.configureAreas();
});

When('atribuo as subchaves com numeração global', async ({ fullEvent }) => {
  await fullEvent.assignGroupsWithGlobalNumbers();
});

When('reordeno a programação em rascunho', async ({ fullEvent }) => {
  await fullEvent.reorderDraftSchedule();
});

When('publico a programação', async ({ fullEvent }) => {
  await fullEvent.publishSchedule();
});

Then('a programação pública deve estar correta', async ({ fullEvent }) => {
  await fullEvent.assertPublicSchedule();
});

Then('a visão por equipe deve estar disponível', async ({ fullEvent }) => {
  await fullEvent.assertTeamView();
});

When('confirmo a pesagem', async ({ fullEvent }) => {
  await fullEvent.confirmWeighIn();
});

Then('a premiação permanece bloqueada', async ({ fullEvent }) => {
  await fullEvent.assertAwardsBlocked();
});

When('inicio a operação', async ({ fullEvent }) => {
  await fullEvent.startOperation();
});

When('registro um resultado normal', async ({ fullEvent }) => {
  await fullEvent.recordNormalResult();
});

When('registro um WO', async ({ fullEvent }) => {
  await fullEvent.recordWalkover();
});

When('concluo a final da chave', async ({ fullEvent }) => {
  await fullEvent.finishSemiFinal();
});

When('confirmo a premiação', async ({ fullEvent }) => {
  await fullEvent.confirmAwards();
});

Then('as colocações devem estar corretas', async ({ fullEvent }) => {
  await fullEvent.assertPlacementsAndWalkover();
});

Then('o WO deve ser distinto de bye', async ({ fullEvent }) => {
  await fullEvent.assertWalkoverDistinctFromBye();
});

Then('o público deve refletir os resultados sem controles administrativos', async ({ fullEvent }) => {
  await fullEvent.assertPublicResults();
});

When('concluo o evento', async ({ fullEvent }) => {
  await fullEvent.concludeEvent();
});

Then('o estado final administrativo deve ser concluído', async ({ fullEvent }) => {
  await fullEvent.assertAdminConcluded();
});

Then('o público deve permanecer encerrado', async ({ fullEvent }) => {
  await fullEvent.assertFinalPublicState();
});
