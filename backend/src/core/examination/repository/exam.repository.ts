import { ExaminationDocument } from "../../../types/exam";
import { BaseRepository } from "../../base/base.repository";
import { ExaminationModel } from "../model/examination.model";
import { IExaminationRepository } from "./interface/iexam.repository";

export class ExaminationRepository 
        extends BaseRepository<ExaminationDocument> 
        implements IExaminationRepository {

            constructor() {
                super(ExaminationModel)
            }

}