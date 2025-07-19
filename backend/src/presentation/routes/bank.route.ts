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
            .get('/by-instructor/:instructorId', catchAsync(async ({ params, controller }: BankContext & { params: { instructorId: string } }) => 
                await controller.getBanksByInstructorId(params.instructorId)))
            
            // Get maximum allowed sub-bank depth
            .get('/max-depth', catchAsync(async ({ controller }: BankContext) => {
                return await controller.getMaxSubBankDepth();
            }))
            
            // Bank by ID group
            .group('/bank-:id', app => app
                // Check if sub-bank creation is allowed - supports both direct bank and sub-bank contexts
                .post('/can-create-subbank', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string }, body: { parentBankId?: string, subBankId?: string, subBankPath?: string[] } }) => {
                    // If parentBankId and subBankId are provided, we're checking from within a sub-bank context
                    if (body.parentBankId && body.subBankId) {
                        return await controller.canCreateSubBankInSubBank(body.parentBankId, body.subBankId);
                    }
                    // Otherwise, use the original logic with the bank ID from URL
                    return await controller.canCreateSubBank(params.id, body.subBankPath || []);
                }), {
                    body: t.Object({
                        parentBankId: t.Optional(t.String()),
                        subBankId: t.Optional(t.String()),
                        subBankPath: t.Optional(t.Array(t.String()))
                    })
                })
                .get('', catchAsync(async ({ params, controller }: BankContext & { params: { id: string } }) => 
                    await controller.getBankById(params.id)))
                .put('', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string }, body: UpdateBankBody }) => 
                    await controller.updateBank(params.id, body)), {
                    body: UpdateBankSchema
                })
                .delete('', catchAsync(async ({ params, controller, user }: BankContext & { params: { id: string }, user: any }) => 
                    await controller.deleteBank(params.id, user._id)))
                
                // SubBank creation routes
                // For creating direct sub-bank under main bank (top level)
                .post('/sub-bank/direct', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string }, body: CreateSubBankBody }) => {
                    // Direct sub-bank creation under main bank - no parent sub-bank
                    return await controller.createSubBank(params.id, body.name, body.exam_ids);
                }), {
                    body: CreateSubBankSchema
                })
                
                // For creating nested sub-bank within a specific parent sub-bank
                // Requires both parent bank ID (from URL) and parent sub-bank ID (from URL)
                .post('/sub-bank/nested/:parentSubBankId', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string, parentSubBankId: string }, body: CreateSubBankBody }) => {
                    // Nested sub-bank creation: parent bank ID + parent sub-bank ID + new sub-bank data
                    console.log(`Route: Creating nested sub-bank under parent bank: ${params.id}, parent sub-bank: ${params.parentSubBankId}`);
                    return await controller.createNestedSubBankWithParent(params.id, params.parentSubBankId, body.name, body.exam_ids);
                }), {
                    body: CreateSubBankSchema
                })
                
                // Legacy route for backward compatibility (DEPRECATED - use /direct or /nested instead)
                .post('/sub-bank-in/:subBankId', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string, subBankId: string }, body: CreateSubBankBody }) => {
                    console.warn('DEPRECATED: Use /sub-bank/nested/:parentSubBankId instead of /sub-bank-in/:subBankId');
                    return await controller.createSubBankInSubBank(params.id, params.subBankId, body.name, body.exam_ids);
                }), {
                    body: CreateSubBankSchema
                })
                
                // Nested SubBank routes
                .post('/sub-bank-nested/:nestedPath', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string, nestedPath: string }, body: CreateSubBankBody }) => {
                    // The path should already include all necessary IDs in the correct order
                    const subBankPath = params.nestedPath.split(',');
                    console.log('Creating nested sub-bank with path:', subBankPath);
                    return await controller.createNestedSubBank(params.id, subBankPath, body.name, body.exam_ids);
                }), {
                    body: CreateSubBankSchema
                })
                .get('/hierarchy', catchAsync(async ({ params, controller, user }: BankContext & { params: { id: string }, user: any }) => 
                    await controller.getSubBankHierarchy(params.id, user._id)))
                
                // New route to get sub-bank by both parent ID and sub-bank ID
                .get('/hierarchy/:subBankId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, subBankId: string } }) => 
                    await controller.getSubBankHierarchyByParentAndId(params.id, params.subBankId)))
                
                // Sub-bank update routes
                .put('/sub-bank/:subBankId', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string, subBankId: string }, body: any }) => 
                    await controller.updateSubBank(params.id, [], params.subBankId, body)))
                
                // Simple rename route - just parent ID and sub-bank ID
                .put('/rename/:parentId/:subBankId', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string, parentId: string, subBankId: string }, body: { name: string } }) => 
                    await controller.renameSubBank(params.parentId, params.subBankId, body.name)))
                
                // Simple add exam to sub-bank route - just parent ID, sub-bank ID, and exam ID
                .post('/add-exam/:parentId/:subBankId/:examId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, parentId: string, subBankId: string, examId: string } }) => 
                    await controller.addExamToSubBankSimple(params.parentId, params.subBankId, params.examId)))
                
                // Use a different route structure for nested sub-banks to avoid parameter conflicts
                .put('/sub-bank-nested/:nestedPath/:targetId', catchAsync(async ({ params, body, controller }: BankContext & { params: { id: string, nestedPath: string, targetId: string }, body: any }) => {
                    const subBankPath = params.nestedPath.split(',');
                    return await controller.updateSubBank(params.id, subBankPath, params.targetId, body);
                }))
                
                // Delete sub-bank routes
                .delete('/sub-bank/:subBankId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, subBankId: string } }) => 
                    await controller.deleteSubBank(params.id, [], params.subBankId)))
                
                // Delete nested sub-bank route
                .delete('/sub-bank-nested/:nestedPath/:targetId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, nestedPath: string, targetId: string } }) => {
                    const subBankPath = params.nestedPath.split(',');
                    return await controller.deleteSubBank(params.id, subBankPath, params.targetId);
                }))
                
                // Exam management in banks
                .post('/exam/:examId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, examId: string } }) => 
                    await controller.addExamToBank(params.id, params.examId)))
                .delete('/exam/:examId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, examId: string } }) => 
                    await controller.removeExamFromBank(params.id, params.examId)))
                
                // Exam management in sub-banks
                .post('/sub-bank-path/:subBankPath/exam/:examId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, subBankPath: string, examId: string } }) => {
                    const subBankPathArray = params.subBankPath.split(',');
                    return await controller.addExamToSubBank(params.id, subBankPathArray, params.examId);
                }))
                .delete('/sub-bank-path/:subBankPath/exam/:examId', catchAsync(async ({ params, controller }: BankContext & { params: { id: string, subBankPath: string, examId: string } }) => {
                    const subBankPathArray = params.subBankPath.split(',');
                    return await controller.removeExamFromSubBank(params.id, subBankPathArray, params.examId);
                }))
                
                // Direct sub-bank exam management (shortcut route)
                .post('/sub-bank-exam/:examId', catchAsync(async ({ params, controller, body }: BankContext & { params: { id: string, examId: string }, body: any }) => {
                    // This route handles direct sub-bank exam associations
                    // If subBankId is provided in body, use it to determine which sub-bank to add the exam to
                    const subBankId = body.subBankId;
                    console.log('Adding exam to sub-bank with: bankId=', params.id, 'subBankId=', subBankId, 'examId=', params.examId);
                    
                    if (!subBankId) {
                        throw new Error('subBankId is required in request body');
                    }
                    
                    // Call the service method to add the exam to the sub-bank
                    const result = await controller.addExamToSubBank(params.id, [subBankId], params.examId);
                    console.log('Result from addExamToSubBank:', result);
                    return result;
                }), {
                    body: t.Object({
                        subBankId: t.String()
                    })
                })
                
                // Check if sub-bank creation is allowed at current depth
                .post('/can-create-subbank', catchAsync(async ({ params, controller, body }: BankContext & { params: { id: string }, body: { subBankPath: string[] } }) => {
                    return await controller.canCreateSubBank(params.id, body.subBankPath || []);
                }), {
                    body: t.Object({
                        subBankPath: t.Optional(t.Array(t.String()))
                    })
                })
            )
    );
