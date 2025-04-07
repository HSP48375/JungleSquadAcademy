import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, tierId } = session.metadata || {};
        
        if (!userId || !tierId) {
          console.error('Missing metadata in checkout session');
          break;
        }

        console.log(`Checkout completed for user ${userId}, tier ${tierId}`);

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Get tier ID from database
        const { data: tierData, error: tierError } = await supabase
          .from('subscription_tiers')
          .select('id')
          .eq('stripe_price_id', tierId)
          .single();

        if (tierError) {
          console.error('Error fetching tier:', tierError.message);
          break;
        }

        // Create or update user subscription
        const { error: upsertError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            tier_id: tierData.id,
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            status: 'active',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (upsertError) {
          console.error('Error upserting subscription:', upsertError.message);
          break;
        }

        // For Elite tier, grant initial perks
        if (tierId === 'prod_S45MNphHMSIXeq') {
          // Grant exclusive avatar species
          const { data: eliteSpecies, error: speciesError } = await supabase
            .from('avatar_species')
            .select('id')
            .eq('name', 'Galactic Chameleon')
            .single();

          if (!speciesError && eliteSpecies) {
            await supabase
              .from('avatar_unlocks')
              .upsert({
                user_id: userId,
                species_id: eliteSpecies.id,
                unlocked_at: new Date().toISOString(),
              });
          }

          // Grant coins bonus
          await supabase.rpc('handle_coin_transaction', {
            p_user_id: userId,
            p_amount: 100,
            p_type: 'reward',
            p_description: 'Elite Legend Squad welcome bonus',
          });
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (!subscriptionId) {
          console.error('Missing subscription ID in invoice');
          break;
        }

        console.log(`Payment succeeded for subscription ${subscriptionId}`);
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Update subscription period
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (updateError) {
          console.error('Error updating subscription:', updateError.message);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        console.log(`Subscription deleted: ${subscription.id}`);
        
        // Deactivate subscription
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription status:', updateError.message);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        console.log(`Subscription updated: ${subscription.id}`);
        
        // Get the current status
        let status = 'active';
        if (subscription.cancel_at_period_end) {
          status = 'canceling';
        } else if (subscription.status === 'canceled') {
          status = 'canceled';
        } else if (subscription.status === 'past_due') {
          status = 'past_due';
        }
        
        // Update subscription in database
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError.message);
        }

        break;
      }
    }

    return new Response(JSON.stringify({ received: true }));
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400 }
    );
  }
});