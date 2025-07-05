import Elysia, { t } from "elysia";
import { BankController } from "../controllers/bank.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { CreateBankSchema, CreateSubBankSchema, UpdateBankSchema } from "./schema/bank.schema";
import { catchAsync } from "../../utils/error";
import { Static } from "@sinclair/typebox";
import { Context } from "elysia";

type BankContext = Context & {
    controller: BankController;
}

type CreateBankBody = Static<typeof CreateBankSchema>;
type UpdateBankBody = Static<typeof UpdateBankSchema>;
type CreateSubBankBody = Static<typeof CreateSubBankSchema>;

export const BankRoute = new Elysia({ prefix: '/bank' })
    .derive(() => {
        return { controller: new BankController() };
    })
    .use(tokenVerifier)
    .group('', (app) =>
        app
            // Bank routes
            .post('', catchAsync(async ({ body, controller, user }: BankContext & { body: CreateBankBody, user: any }) => {
                // Get instructor ID from the user context added by the tokenVerifier middleware
                const instructorId = user._id as unknown as string;
                return await controller.createBank(body.bank_name, body.exam_id, instructorId);
            }), {
                body: CreateBankSchema
            })
            .get('/by-exam/:examId', catchAsync(async ({ params, controller }: BankContext & { params: { examId: string } }) => 
                await controller.getBanksByExamId(params.examId)))
            
            // Bank by ID group
            .group('/bank-:id', app => app
                .get('', catchAsync(async ({ params, controller }: BankContext & { params: { id: string } }) => 
                    await controller.getBankById(params.id)))
                .put('', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string }, body: UpdateBankBody }) => 
                    await controller.updateBank(params.id, body)), {
                    body: UpdateBankSchema
                })
                .delete('', catchAsync(async ({ params, controller }: BankContext & { params: { id: string } }) => 
                    await controller.deleteBank(params.id)))
                
                // SubBank routes
                .post('/sub-bank', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string }, body: CreateSubBankBody }) => 
                    await controller.createSubBank(params.id, body.name, body.exam_ids, body.parent_id)), {
                    body: CreateSubBankSchema
                })
                .get('/hierarchy', catchAsync(async ({ params, controller }: BankContext & { params: { id: string } }) => 
                    await controller.getSubBankHierarchy(params.id)))
                
                // Sub-bank update routes
                .put('/sub-bank/:subBankId', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string, subBankId: string }, body: any }) => 
                    await controller.updateSubBank(params.id, [], params.subBankId, body)))
                
                // Use a different route structure for nested sub-banks to avoid parameter conflicts
                .put('/sub-bank-nested/:nestedPath/:targetId', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string, nestedPath: string, targetId: string }, body: any }) => {
                    const subBankPath = params.nestedPath.split(',');
                    return await controller.updateSubBank(params.id, subBankPath, params.targetId, body);
                }))
                
                // Exam management in banks
                .post('/exam/:examId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, examId: string } }) => 
                    await controller.addExamToBank(params.id, params.examId)))
                .delete('/exam/:examId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, examId: string } }) => 
                    await controller.removeExamFromBank(params.id, params.examId)))
                
                // Exam management in sub-banks
                .post('/sub-bank/:path/exam/:examId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, path: string, examId: string } }) => {
                    const subBankPath = params.path.split(',');
                    return await controller.addExamToSubBank(params.id, subBankPath, params.examId);
                }))
                .delete('/sub-bank/:path/exam/:examId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, path: string, examId: string } }) => {
                    const subBankPath = params.path.split(',');
                    return await controller.removeExamFromSubBank(params.id, subBankPath, params.examId);
                }))
            )
    );
