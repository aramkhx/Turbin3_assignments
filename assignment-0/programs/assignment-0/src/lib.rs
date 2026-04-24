use anchor_lang::prelude::*;

declare_id!("7z6j5Gx1FaffhYFYKFUmeZvZR6Ct9bS2aTwYQLdv5sWJ");

#[program]
pub mod assignment_0 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
