import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateMemberDto } from "../../modules/members/dto/create-member.dto";
import { UpdateMemberDto } from "../../modules/members/dto/update-member.dto";
import { BulkCreateMembersDto } from "../../modules/members/dto/bulk-create-members.dto";
import { CreateMinisterDto } from "../../modules/ministers/dto/create-minister.dto";
import { UpdateMinisterDto } from "../../modules/ministers/dto/update-minister.dto";
import { CreateFamilyChildDto } from "../../modules/families/dto/create-family-child.dto";
import { UpdateFamilyChildDto } from "../../modules/families/dto/update-family-child.dto";
import { CreateUserDto } from "../../modules/users/dto/create-user.dto";
import { UpdateUserDto } from "../../modules/users/dto/update-user.dto";
import { CreatePlanDto } from "../../modules/plans/dto/create-plan.dto";
import { CreateTaskDto } from "../../modules/tasks/dto/create-task.dto";
import { UpdateTaskDto } from "../../modules/tasks/dto/update-task.dto";
import { RegisterDto } from "../../modules/auth/dto/register.dto";
import { CreateRoleDto } from "../../modules/access/dto/create-role.dto";

async function transformAndValidate<T extends object>(
  cls: new () => T,
  raw: Record<string, unknown>,
) {
  const instance = plainToInstance(cls, raw, {
    enableImplicitConversion: true,
  });
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { instance, errors };
}

describe("Data quality DTO normalization and date validation", () => {
  it("normalizes names and accepts partial EC dates on CreateMemberDto", async () => {
    const { instance, errors } = await transformAndValidate(CreateMemberDto, {
      first_name: "  dawit ",
      middle_name: "tesfaye",
      last_name: "ABERA",
      profession: "software engineer",
      employer: "IT solutions",
      date_of_birth: "1984",
      date_of_birth_calendar: "EC",
      joined_date: "2018-06",
      joined_date_calendar: "ec",
      salvation_date: "1999",
    });

    expect(errors).toHaveLength(0);
    expect(instance.first_name).toBe("Dawit");
    expect(instance.middle_name).toBe("Tesfaye");
    expect(instance.last_name).toBe("Abera");
    expect(instance.profession).toBe("Software Engineer");
    expect(instance.employer).toBe("IT Solutions");
    expect(instance.date_of_birth_calendar).toBe("ec");
    expect(instance.joined_date_calendar).toBe("ec");
  });

  it("preserves @Transform and @IsFlexibleDate inheritance on UpdateMemberDto and BulkCreateMembersDto", async () => {
    const patchRes = await transformAndValidate(UpdateMemberDto, {
      first_name: "anne-marie",
      date_of_birth: "1984-13-05",
      date_of_birth_calendar: "ec",
    });
    expect(patchRes.errors).toHaveLength(0);
    expect(patchRes.instance.first_name).toBe("Anne-Marie");

    const bulkRes = await transformAndValidate(BulkCreateMembersDto, {
      items: [
        {
          first_name: "john",
          last_name: "o'connor",
          salvation_date: "1995-04",
          salvation_date_calendar: "gc",
        },
      ],
    });
    expect(bulkRes.errors).toHaveLength(0);
    expect(bulkRes.instance.items[0].first_name).toBe("John");
    expect(bulkRes.instance.items[0].last_name).toBe("O'Connor");
  });

  it("normalizes mixed-case inputs like WONgel TesT on members and roles", async () => {
    const memberRes = await transformAndValidate(CreateMemberDto, {
      first_name: "WONgel",
      middle_name: "wOnGeL",
      last_name: "TesT",
      profession: "YOUth paSTOR",
    });
    expect(memberRes.errors).toHaveLength(0);
    expect(memberRes.instance.first_name).toBe("Wongel");
    expect(memberRes.instance.middle_name).toBe("Wongel");
    expect(memberRes.instance.last_name).toBe("Test");
    expect(memberRes.instance.profession).toBe("Youth Pastor");

    const roleRes = await transformAndValidate(CreateRoleDto, {
      key: "volunteer_coordinator",
      name: "vOLunteer COordINator",
      permissionSlugs: ["members.read"],
    });
    expect(roleRes.errors).toHaveLength(0);
    expect(roleRes.instance.name).toBe("Volunteer Coordinator");
  });

  it("rejects invalid Ethiopian Pagume 6 in non-leap year", async () => {
    const { errors } = await transformAndValidate(CreateMemberDto, {
      first_name: "hana",
      last_name: "girum",
      date_of_birth: "2016-13-06",
      date_of_birth_calendar: "ec",
    });
    expect(errors.some((e) => e.property === "date_of_birth")).toBe(true);
  });

  it("validates partial and exact dates on Ministers and Family Children", async () => {
    const minRes = await transformAndValidate(UpdateMinisterDto, {
      first_name: "daniel",
      title: "senior pastor",
      joined_date: "2012",
      joined_date_calendar: "ec",
    });
    expect(minRes.errors).toHaveLength(0);
    expect(minRes.instance.first_name).toBe("Daniel");
    expect(minRes.instance.title).toBe("Senior Pastor");

    const fullMin = await transformAndValidate(CreateMinisterDto, {
      first_name: "samuel",
      last_name: "bekele",
      email: "samuel@example.com",
      date_of_birth: "1980-05",
      date_of_birth_calendar: "ec",
    });
    expect(fullMin.errors).toHaveLength(0);
    expect(fullMin.instance.first_name).toBe("Samuel");
    expect(fullMin.instance.last_name).toBe("Bekele");

    const childRes = await transformAndValidate(CreateFamilyChildDto, {
      name: "caleb dawit",
      date_of_birth: "2015-13-06",
      date_of_birth_calendar: "ec",
    });
    expect(childRes.errors).toHaveLength(0);
    expect(childRes.instance.name).toBe("Caleb Dawit");

    const childPatch = await transformAndValidate(UpdateFamilyChildDto, {
      name: "ruth dawit",
      date_of_birth: "2018",
      date_of_birth_calendar: "gc",
    });
    expect(childPatch.errors).toHaveLength(0);
    expect(childPatch.instance.name).toBe("Ruth Dawit");
  });

  it("normalizes user, registration, plan, and task DTOs properly", async () => {
    const userRes = await transformAndValidate(CreateUserDto, {
      first_name: "abel",
      last_name: "tadesse",
      email: "abel@example.com",
      password_hash: "Str0ng!Pass#2026",
      role: "minister",
      title: "youth leader",
    });
    expect(userRes.errors).toHaveLength(0);
    expect(userRes.instance.first_name).toBe("Abel");
    expect(userRes.instance.last_name).toBe("Tadesse");
    expect(userRes.instance.title).toBe("Youth Leader");

    const updateUserRes = await transformAndValidate(UpdateUserDto, {
      first_name: "sara",
      middle_name: "kassa",
      last_name: "gebru",
    });
    expect(updateUserRes.errors).toHaveLength(0);
    expect(updateUserRes.instance.first_name).toBe("Sara");
    expect(updateUserRes.instance.middle_name).toBe("Kassa");
    expect(updateUserRes.instance.last_name).toBe("Gebru");

    const regRes = await transformAndValidate(RegisterDto, {
      fullName: "lidya solomon negash",
      email: "lidya@example.com",
      password: "Str0ng!Pass#2026",
    });
    expect(regRes.errors).toHaveLength(0);
    expect(regRes.instance.fullName).toBe("Lidya Solomon Negash");

    // Operational Planning/Tasks require full exact dates (allowPartial = false)
    const partialPlan = await transformAndValidate(CreatePlanDto, {
      title: "Prayer Night",
      type: "program",
      plan_date: "2019-03",
      plan_date_calendar: "ec",
    });
    expect(partialPlan.errors.some((e) => e.property === "plan_date")).toBe(true);

    const exactEcPlan = await transformAndValidate(CreatePlanDto, {
      title: "Prayer Night",
      type: "program",
      plan_date: "2019-03-01",
      plan_date_calendar: "ec",
    });
    expect(exactEcPlan.errors).toHaveLength(0);

    const taskRes = await transformAndValidate(CreateTaskDto, {
      definition_id: "11111111-1111-4111-8111-111111111111",
      minister_id: "22222222-2222-4222-8222-222222222222",
      start_date: "2019-03-01",
      end_date: "2019-03-10",
      date_calendar: "ec",
    });
    expect(taskRes.errors).toHaveLength(0);

    const taskPatch = await transformAndValidate(UpdateTaskDto, {
      start_date: "2019",
      date_calendar: "ec",
    });
    expect(taskPatch.errors.some((e) => e.property === "start_date")).toBe(true);
  });
});

