"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const tasks_service_1 = require("./tasks.service");
const create_task_definition_dto_1 = require("./dto/create-task-definition.dto");
const update_task_definition_dto_1 = require("./dto/update-task-definition.dto");
const create_task_dto_1 = require("./dto/create-task.dto");
const update_task_dto_1 = require("./dto/update-task.dto");
const task_query_dto_1 = require("./dto/task-query.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let TasksController = class TasksController {
    constructor(tasksService) {
        this.tasksService = tasksService;
    }
    // Definitions
    listDefinitions(activeOnly) {
        return this.tasksService.listDefinitions(activeOnly === "true");
    }
    createDefinition(dto) {
        return this.tasksService.createDefinition(dto);
    }
    updateDefinition(id, dto) {
        return this.tasksService.updateDefinition(id, dto);
    }
    removeDefinition(id) {
        return this.tasksService.removeDefinition(id);
    }
    // Assignments
    findMine(req, status) {
        return this.tasksService.findMine(req.user.id, status);
    }
    findAll(query) {
        return this.tasksService.findAll(query);
    }
    findOne(id) {
        return this.tasksService.findOne(id);
    }
    create(dto, req) {
        return this.tasksService.createTask(dto, req.user.id);
    }
    complete(id, req) {
        var _a;
        const isAdmin = ((_a = req.user.roleEntity) === null || _a === void 0 ? void 0 : _a.key) === "admin" || req.user.role === "admin";
        return this.tasksService.complete(id, req.user.id, isAdmin);
    }
    update(id, dto) {
        return this.tasksService.update(id, dto);
    }
    remove(id) {
        return this.tasksService.remove(id);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Get)("definitions"),
    (0, permissions_decorator_1.RequiresPermissions)("tasks.read"),
    __param(0, (0, common_1.Query)("activeOnly")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "listDefinitions", null);
__decorate([
    (0, common_1.Post)("definitions"),
    (0, permissions_decorator_1.RequiresPermissions)("tasks.create"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_task_definition_dto_1.CreateTaskDefinitionDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "createDefinition", null);
__decorate([
    (0, common_1.Patch)("definitions/:id"),
    (0, permissions_decorator_1.RequiresPermissions)("tasks.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_task_definition_dto_1.UpdateTaskDefinitionDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "updateDefinition", null);
__decorate([
    (0, common_1.Delete)("definitions/:id"),
    (0, permissions_decorator_1.RequiresPermissions)("tasks.delete"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "removeDefinition", null);
__decorate([
    (0, common_1.Get)("mine"),
    (0, permissions_decorator_1.RequiresPermissions)("tasks.read"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequiresPermissions)("tasks.read"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [task_query_dto_1.TaskQueryDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("tasks.read"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequiresPermissions)("tasks.create"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_task_dto_1.CreateTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id/complete"),
    (0, permissions_decorator_1.RequiresPermissions)("tasks.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("tasks.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_task_dto_1.UpdateTaskDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("tasks.delete"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "remove", null);
exports.TasksController = TasksController = __decorate([
    (0, common_1.Controller)("tasks"),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
