import { Request, Response } from 'express';
import { AppDataSource } from '../config/db';
import { Organization } from '../database/models/OrganizationModel';
import { Users } from '../database/models/UserModel';
import { logActivity } from '../middleware/ActivityLog';
import { excludePassword } from '../utils/excludePassword';


interface CustomRequest extends Request {
  user?: {
    id: number;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class OrganizationController {

  // endpoint to create an organization
static async createOrganization(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, address, city, country, phoneNumber, website = [] } = req.body;

    const orgRepo = AppDataSource.getRepository(Organization);

    const org = orgRepo.create({
      name,
      description,
      address,
      city,
      country,
      phoneNumber,
      website,
    });
    await orgRepo.save(org);

    await logActivity({
      action: "Created organization",
      targetId: String(org.id),
      targetType: "Organization",
      details: `Organization '${org.name}' created.`
    });

    res.status(201).json({
      message: 'Organization created successfully.',
      organization: org,
    });

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.', error });
  }
}



// endpoint to get a specific organization
static async getOrganization(req: CustomRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const orgId = Number(id);

    const orgRepo = AppDataSource.getRepository(Organization);

    const org = await orgRepo.findOne({
      where: { id: orgId } });

    if (!org) {
      res.status(404).json({ message: 'Organization not found.' });
      return;
    }

    const userId = req.user?.id;
    const user = await AppDataSource.getRepository(Users).findOne({
      where: { id: userId } });

    if (!user) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json({ message: 'Organization updated.', organization: org });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.'});
  }
}




// New endpoint to get all organizations without ID
   static async getAllOrganizations(req: Request, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const orgRepo = AppDataSource.getRepository(Organization);

    const [organizations, total] = await orgRepo.findAndCount({
      skip: offset,
      take: limit,
    });

    const sanitized = organizations.map(org => ({
      ...org,
    }));

    res.status(200).json({
      message: "Organizations fetched successfully",
      page,
      limit,
      total,
      organizations: sanitized,
    });
  } catch (error) {
    console.log(error as Error);
    res.status(500).json({ message: 'Something went wrong, please try again.' });
  }
}



  // endpoint to update an organization's info
static async updateOrganizationInfo(req: CustomRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      address,
      city,
      country,
      phoneNumber,
      website,
    } = req.body;

    const orgRepo = AppDataSource.getRepository(Organization);

    const org = await orgRepo.findOne({
      where: { id: Number(id) }});

    if (!org) {
      res.status(404).json({ message: 'Organization not found.' });
      return;
    }

    const actingUser = req.user!;

    if (name) org.name = name;
    if (description) org.description = description;
    if (address) org.address = address;
    if (city) org.city = city;
    if (country) org.country = country;
    if (phoneNumber) org.phoneNumber = phoneNumber;
    if (website) org.website = website;

    await orgRepo.save(org);


    await logActivity({
      userId: actingUser.id,
      action: "Updated organization",
      targetId: String(org.id),
      targetType: "Organization",
      details: `Organization '${org.name}' updated.`,
    });

    res.status(200).json({ message: 'Organization updated.', organization: org });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong, please try again.' });
  }
}




  // endpoint to delete an organization
  static async deleteOrganization(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const orgRepository = AppDataSource.getRepository(Organization);
      const org = await AppDataSource.getRepository(Organization).findOne({
        where: { id: Number(id) }});

      if (!org) {
        res.status(404).json({ message: 'Organization not found.' });
        return;
      }

      await logActivity({
        userId: req.user!.id,
        action: "Deleted organization",
        targetId: String(org.id),
        targetType: "Organization",
        details: `Deleted organization named '${org.name}'.`,
      });

      await orgRepository.remove(org);
      res.status(200).json({ message: 'Organization deleted successfully.' });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Something went wrong, please try again.', error });
    }
  }



static async getAllMembers(req: Request, res: Response): Promise<void> {
  const orgId = Number(req.params.id);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (isNaN(orgId)) {
    res.status(400).json({ message: "Invalid organization ID" });
    return;
  }

  try {
    const userRepo = AppDataSource.getRepository(Users);

    // Get all matching users (main org or sub-orgs)
    const allMembers = await userRepo
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.organization", "org")
      .where("org.id = :orgId", { orgId })
      .getMany();

    const flagged = allMembers.map(user => ({
      ...excludePassword(user),
    }));

    const paginated = flagged.slice(offset, offset + limit);

    res.status(200).json({
      page,
      limit,
      total: flagged.length,
      members: paginated,
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

}


 