/**
 * Job Import Service
 * Handles importing jobs from CSV files
 */
import Papa from 'papaparse';

/**
 * Job Import Service
 */
export class JobImportService {
  /**
   * Parse CSV file and convert to job objects
   * @param {File} file - CSV file
   * @returns {Promise<Array>} Array of job objects
   */
  static async parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const jobs = results.data.map((row) => this.mapCSVRowToJob(row));
            resolve(jobs.filter((job) => job.title && job.company)); // Filter out invalid rows
          } catch (error) {
            reject(new Error(`Failed to parse CSV: ${error.message}`));
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
      });
    });
  }

  /**
   * Map CSV row to Job entity format
   * @param {Object} row - CSV row object
   * @returns {Object} Job object
   */
  static mapCSVRowToJob(row) {
    return {
      title: this.cleanField(row.title || row['Job Title'] || row['job_title']),
      company: this.cleanField(row.company || row['Company'] || row['company_name']),
      company_logo: this.cleanField(row.company_logo || row['Company Logo'] || row['logo']),
      location: this.cleanField(row.location || row['Location'] || row['job_location']),
      salary_min: this.parseNumber(row.salary_min || row['Salary Min'] || row['min_salary']),
      salary_max: this.parseNumber(row.salary_max || row['Salary Max'] || row['max_salary']),
      role_type: this.mapRoleType(
        row.role_type || row['Role Type'] || row['type'] || row['employment_type']
      ),
      work_arrangement: this.mapWorkArrangement(
        row.work_arrangement || row['Work Arrangement'] || row['arrangement'] || row['remote']
      ),
      industry: this.cleanField(row.industry || row['Industry']),
      description: this.cleanField(row.description || row['Description'] || row['job_description']),
      required_skills: this.parseArray(
        row.required_skills || row['Required Skills'] || row['skills'] || row['tech_stack']
      ),
      preferred_skills: this.parseArray(
        row.preferred_skills || row['Preferred Skills'] || row['nice_to_have']
      ),
      required_qualifications: this.parseArray(
        row.required_qualifications ||
          row['Required Qualifications'] ||
          row['qualifications'] ||
          row['education']
      ),
      constraints: this.parseArray(row.constraints || row['Constraints'] || row['requirements']),
      typical_day: this.cleanField(row.typical_day || row['Typical Day'] || row['day_to_day']),
      challenges: this.cleanField(row.challenges || row['Challenges']),
      first_90_days: this.cleanField(row.first_90_days || row['First 90 Days'] || row['onboarding']),
      employer_transparency_score: this.parseNumber(
        row.employer_transparency_score || row['Transparency Score']
      ),
      hiring_responsiveness: this.parseNumber(
        row.hiring_responsiveness || row['Hiring Responsiveness']
      ),
      jd_accuracy: this.parseNumber(row.jd_accuracy || row['JD Accuracy']),
      candidate_feedback: this.parseNumber(row.candidate_feedback || row['Candidate Feedback']),
      tags: this.parseArray(row.tags || row['Tags'] || row['categories']),
    };
  }

  /**
   * Clean and trim field value
   */
  static cleanField(value) {
    if (!value) return '';
    return String(value).trim();
  }

  /**
   * Parse number field
   */
  static parseNumber(value) {
    if (!value) return null;
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : num;
  }

  /**
   * Parse array field (comma-separated or pipe-separated)
   */
  static parseArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    const str = String(value).trim();
    if (!str) return [];
    // Support both comma and pipe separators
    return str
      .split(/[,|]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  /**
   * Map role type to enum value
   */
  static mapRoleType(value) {
    if (!value) return 'full-time';
    const normalized = String(value).toLowerCase().trim();
    if (normalized.includes('full') || normalized === 'ft') return 'full-time';
    if (normalized.includes('part') || normalized === 'pt') return 'part-time';
    if (normalized.includes('contract')) return 'contract';
    if (normalized.includes('intern')) return 'intern';
    return 'full-time'; // Default
  }

  /**
   * Map work arrangement to enum value
   */
  static mapWorkArrangement(value) {
    if (!value) return 'on-site';
    const normalized = String(value).toLowerCase().trim();
    if (normalized.includes('remote') || normalized === 'wfh') return 'remote';
    if (normalized.includes('hybrid')) return 'hybrid';
    return 'on-site'; // Default
  }

  /**
   * Import jobs from CSV and save to backend
   * @param {File} file - CSV file
   * @param {Function} saveJobFn - Function to save each job (e.g., dataService.addJob)
   * @returns {Promise<Object>} Import result with success count and errors
   */
  static async importJobs(file, saveJobFn) {
    try {
      const jobs = await this.parseCSV(file);
      const results = {
        total: jobs.length,
        success: 0,
        errors: [],
      };

      for (const job of jobs) {
        try {
          await saveJobFn(job);
          results.success++;
        } catch (error) {
          results.errors.push({
            job: job.title || 'Unknown',
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Job import failed: ${error.message}`);
    }
  }
}
