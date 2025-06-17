import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Template } from '../../types/template';

// Collection reference
const templatesCollection = collection(db, 'templates');

// Get all templates
export const getTemplates = async (): Promise<Template[]> => {
  try {
    // First try to get from Firestore
    const snapshot = await getDocs(templatesCollection);
    const templates = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
      } as Template;
    });

    // If no templates exist in Firestore, check localStorage
    if (templates.length === 0) {
      const localTemplates = localStorage.getItem('quotation-templates');
      if (localTemplates) {
        const parsedTemplates = JSON.parse(localTemplates);
        // Migrate local templates to Firestore
        for (const template of parsedTemplates) {
          await createTemplate(template);
        }
        return parsedTemplates;
      }

      // If no templates exist anywhere, create the default template
      const defaultTemplate: Omit<Template, 'id'> = {
        name: 'Default Template',
        description: 'Standard quotation template with company branding',
        content: defaultTemplateContent,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const defaultTemplateDoc = await createTemplate(defaultTemplate);
      return [defaultTemplateDoc];
    }

    return templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

// Get template by ID
export const getTemplate = async (id: string): Promise<Template | null> => {
  try {
    const docRef = doc(templatesCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
    } as Template;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

// Create new template
export const createTemplate = async (template: Omit<Template, 'id'>): Promise<Template> => {
  try {
    const docRef = await addDoc(templatesCollection, {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      ...template,
      id: docRef.id
    };
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

// Update template
export const updateTemplate = async (id: string, updates: Partial<Template>): Promise<void> => {
  try {
    const docRef = doc(templatesCollection, id);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

// Delete template
export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    const docRef = doc(templatesCollection, id);
    
    // Check if it's the default template
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().isDefault) {
      throw new Error('Cannot delete the default template');
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};

// Get default template
export const getDefaultTemplate = async (): Promise<Template | null> => {
  try {
    const q = query(templatesCollection, where('isDefault', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Create default template if it doesn't exist
      const defaultTemplate: Omit<Template, 'id'> = {
        name: 'Default Template',
        description: 'Standard quotation template with company branding',
        content: defaultTemplateContent,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return createTemplate(defaultTemplate);
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
    } as Template;
  } catch (error) {
    console.error('Error getting default template:', error);
    throw error;
  }
};

// Default template content
const defaultTemplateContent = `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 15px;">
  <div style="text-align: center; margin-bottom: 15px;">
    <h1 style="color: #0052CC; margin: 0; font-size: 22px; font-weight: 600;">ASP CRANES</h1>
    <h2 style="color: #42526E; margin: 2px 0; font-size: 16px; font-weight: 500;">QUOTATION</h2>
    <hr style="border: none; height: 1px; background: #0052CC; margin: 8px 0 0 0;">
  </div>

  <table style="width: 100%; margin-bottom: 15px; font-size: 13px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <strong style="color: #42526E;">From:</strong><br>
        <strong>{{company_name}}</strong><br>
        {{company_address}}<br>
        Phone: {{company_phone}}<br>
        Email: {{company_email}}<br>
        GST: {{company_gst}}
      </td>
      <td style="width: 50%; vertical-align: top;">
        <strong style="color: #42526E;">To:</strong><br>
        <strong>{{customer_name}}</strong><br>
        {{customer_designation}}<br>
        {{customer_company}}<br>
        {{customer_address}}<br>
        Phone: {{customer_phone}}<br>
        Email: {{customer_email}}
      </td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px;">
    <tr>
      <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Quotation ID:</strong> {{quotation_number}}</td>
      <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Valid Until:</strong> {{valid_until}}</td>
    </tr>
    <tr>
      <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Date:</strong> {{quotation_date}}</td>
      <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Order Type:</strong> {{order_type}}</td>
    </tr>
  </table>

  <div style="margin-bottom: 15px;">
    <strong style="color: #172B4D; font-size: 13px; display: block; margin-bottom: 8px;">Equipment & Project Details</strong>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA; width: 160px;"><strong>Equipment</strong></td>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{equipment_name}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Duration</strong></td>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{project_duration}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Working Hours</strong></td>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{working_hours}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Shift Type</strong></td>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{shift_type}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Base Rate</strong></td>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{base_rate}}</td>
      </tr>
    </table>
  </div>

  <div style="margin-bottom: 15px;">
    <strong style="color: #172B4D; font-size: 13px; display: block; margin-bottom: 8px;">Pricing Summary</strong>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">Subtotal</td>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6; text-align: right; width: 160px;">{{subtotal}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;">GST (18%)</td>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA; text-align: right;">{{gst_amount}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #0052CC; background: #0052CC; color: white; font-weight: 600;">Total Amount</td>
        <td style="padding: 6px 10px; border: 1px solid #0052CC; background: #0052CC; color: white; text-align: right; font-weight: 600;">{{total_amount}}</td>
      </tr>
    </table>
  </div>

  <div style="margin-bottom: 15px;">
    <strong style="color: #172B4D; font-size: 13px; display: block; margin-bottom: 8px;">Terms & Conditions</strong>
    <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #42526E;">
      <li style="margin-bottom: 2px;">Payment Terms: {{payment_terms}}</li>
      <li style="margin-bottom: 2px;">GST @18% will be charged extra as applicable</li>
      <li style="margin-bottom: 2px;">Mobilization charges will be billed extra based on distance</li>
      <li style="margin-bottom: 2px;">Working hours: Standard 8-hour shift. Additional hours will be charged extra</li>
      <li style="margin-bottom: 2px;">Operator & fuel will be provided by ASP Cranes</li>
      <li style="margin-bottom: 2px;">Client to provide necessary permissions & clearances</li>
      <li style="margin-bottom: 2px;">Rate validity: {{validity_period}}</li>
      <li style="margin-bottom: 2px;">Insurance coverage as per standard terms</li>
    </ol>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #42526E; font-size: 13px;">
    <p style="margin: 0 0 2px 0;"><strong>Thank you for your business!</strong></p>
    <p style="margin: 0;">For any queries, please contact us at {{company_phone}} or email at {{company_email}}</p>
  </div>
</div>`; 